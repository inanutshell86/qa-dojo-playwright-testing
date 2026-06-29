import { test, expect } from "@playwright/test";

function uniqueProduct() {
  const title = "new product " + Math.floor(Math.random() * 1_000_000);
  return {
    title,
    price: 50,
    description: "Created by Playwright API test",
    categoryId: 1,
    images: ["https://i.imgur.com/QkIa5tT.jpeg"],
  };
}

let initialProductId: number;
let initialProductSlug: string;

test.describe("Products API", () => {
  test.beforeAll(async ({ request }) => {
    const response = await request.get(`products?limit=1`, { failOnStatusCode: true });
    const [initialProduct] = await response.json();
    initialProductId = initialProduct.id;
    initialProductSlug = initialProduct.slug;
  });

  test("get a single product by id", async ({ request }) => {
    // Arrange
    const productId = initialProductId;

    // Act
    const response = await request.get(`products/${productId}`, { failOnStatusCode: true });
    const product = await response.json();

    // Assert
    expect(product).toMatchObject({ id: productId, slug: initialProductSlug });
  });

  test("get a single product by slug", async ({ request }) => {
    // Arrange
    const slug = initialProductSlug;

    // Act
    const response = await request.get(`products/slug/${slug}`, { failOnStatusCode: true });
    const product = await response.json();

    // Assert
    expect(product).toMatchObject({ slug });
  });

  test("create a product", async ({ request }) => {
    // Arrange
    const payload = uniqueProduct();

    // Act
    const response = await request.post(`products`, { data: payload, failOnStatusCode: true });
    const product = await response.json();

    // Assert
    expect(response.status()).toBe(201);
    expect(product).toMatchObject({
      title: payload.title,
      price: payload.price,
      description: payload.description,
      category: { id: payload.categoryId },
      images: payload.images,
    });
  });

  test("update a product", async ({ request }) => {
    // Arrange
    const createResponse = await request.post(`products`, {
      data: uniqueProduct(),
      failOnStatusCode: true,
    });
    expect(createResponse.status()).toBe(201);
    const { id, title } = await createResponse.json();
    const updatePayload = { ...uniqueProduct(), title: `Updated ${title}`, price: 99 };

    // Act
    const updateResponse = await request.put(`products/${id}`, {
      data: updatePayload,
      failOnStatusCode: true,
    });
    const updated = await updateResponse.json();

    // Assert
    expect(updateResponse).toBeOK();
    expect(updated).toMatchObject({ id, title: updatePayload.title, price: updatePayload.price });
  });

  test("delete a product", async ({ request }) => {
    // Arrange
    const createResponse = await request.post(`products`, {
      data: uniqueProduct(),
      failOnStatusCode: true,
    });
    expect(createResponse.status()).toBe(201);
    const { id } = await createResponse.json();

    // Act
    const deleteResponse = await request.delete(`products/${id}`, { failOnStatusCode: true });
    const result = await deleteResponse.json();

    // Assert
    expect(deleteResponse).toBeOK();
    expect(result).toBe(true);
  });

  test("pagination - offset and limit", async ({ request }) => {
    // Arrange
    const limit = 5;

    // Act
    const page1Response = await request.get(`products?offset=0&limit=${limit}`, { failOnStatusCode: true });
    const page1 = await page1Response.json();

    const page2Response = await request.get(`products?offset=${limit}&limit=${limit}`, { failOnStatusCode: true });
    const page2 = await page2Response.json();

    // Assert
    expect(page1Response).toBeOK();
    expect(Array.isArray(page1)).toBeTruthy();
    expect(page1.length).toBe(limit);

    expect(page2Response).toBeOK();
    expect(Array.isArray(page2)).toBeTruthy();
    expect(page2.length).toBe(limit);

    expect(page1.length).toBeGreaterThan(0);
    expect(page2.length).toBeGreaterThan(0);

    const page1Ids = page1.map((p: { id: number }) => p.id);
    const page2Ids = page2.map((p: { id: number }) => p.id);
    expect(page2Ids.some((id: number) => page1Ids.includes(id))).toBe(false);
  });

  test("get products related by id", async ({ request }) => {
    // Arrange
    const productId = initialProductId;

    // Act
    const response = await request.get(`products/${productId}/related`, { failOnStatusCode: true });
    const related = await response.json();

    // Assert
    expect(Array.isArray(related)).toBeTruthy();
    expect(related.every((p: { id: number }) => p.id !== productId)).toBe(true);
  });

  test("get products related by slug", async ({ request }) => {
    // Arrange
    const slug = initialProductSlug;

    // Act
    const response = await request.get(`products/slug/${slug}/related`, { failOnStatusCode: true });
    const related = await response.json();

    // Assert
    expect(Array.isArray(related)).toBeTruthy();
    expect(related.every((p: { slug: string }) => p.slug !== slug)).toBe(true);
  });
});
