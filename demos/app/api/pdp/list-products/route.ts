import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get API token from environment variables
    const printifyApiToken = process.env.PDP_PRINTIFY_TOKEN;

    if (!printifyApiToken) {
      return NextResponse.json({ error: "Printify API token not configured" }, { status: 500 });
    }

    // Fetch products from specific shop
    const shopId = 23936709;
    const productsResponse = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${printifyApiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!productsResponse.ok) {
      throw new Error(`Printify API error: ${productsResponse.status} ${productsResponse.statusText}`);
    }

    const products = await productsResponse.json();

    // Map the shop products to our format
    const productCatalog = products.data.map(
      (product: {
        id: string;
        title: string;
        description: string;
        tags: string[];
        images: Array<{ src: string; variant_ids: number[]; position: string; is_default: boolean }>;
        variants: Array<{ id: number; price: number; is_enabled: boolean }>;
        blueprint_id: number;
        user_id: number;
        shop_id: number;
      }) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        tags: product.tags,
        blueprint_id: product.blueprint_id,
        shop_id: product.shop_id,
        images: product.images?.map((img) => img.src) || [],
        variants: product.variants || [],
      })
    );

    // Add a static product for AirPods
    const airpodsProduct = {
      id: "airpods",
      title: "AirPods",
      description: `
        <p>Experience the magic of wireless audio with Apple AirPods. They deliver an unparalleled listening experience with all your devices.</p>
        <br/>
        <ul>
          <li>Rich, high-quality audio and voice</li>
          <li>Seamless switching between devices</li>
          <li>Listen and talk all day with multiple charges from the Charging Case</li>
        </ul>
      `,
      tags: ["electronics", "audio"],
      blueprint_id: 0,
      shop_id: shopId,
      images: ["/airpods.jpg", "/airpods.jpg", "/airpods.jpg"],
      variants: [{ id: 1, price: 199, is_enabled: true }],
    };

    const allProducts = [airpodsProduct, ...productCatalog];

    return NextResponse.json({
      success: true,
      products: allProducts,
      total: allProducts.length,
    });
  } catch (error) {
    console.error("Failed to fetch Printify catalog:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch product catalog",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Optional: Add POST method to fetch specific products with filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blueprintId, printProviderId } = body;

    const printifyApiToken = process.env.PDP_PRINTIFY_TOKEN;

    if (!printifyApiToken) {
      return NextResponse.json({ error: "Printify API token not configured" }, { status: 500 });
    }

    // If specific blueprint requested, fetch its print providers and variants
    if (blueprintId) {
      const printProvidersResponse = await fetch(
        `https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers.json`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${printifyApiToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!printProvidersResponse.ok) {
        throw new Error(`Printify API error: ${printProvidersResponse.status}`);
      }

      const printProviders = await printProvidersResponse.json();

      // If specific print provider requested, fetch variants
      if (printProviderId) {
        const variantsResponse = await fetch(
          `https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${printifyApiToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!variantsResponse.ok) {
          throw new Error(`Printify API error: ${variantsResponse.status}`);
        }

        const variants = await variantsResponse.json();
        return NextResponse.json({
          success: true,
          variants: variants.variants || [],
        });
      }

      return NextResponse.json({
        success: true,
        printProviders: printProviders.data || [],
      });
    }

    return NextResponse.json({ error: "Blueprint ID required for detailed product information" }, { status: 400 });
  } catch (error) {
    console.error("Failed to fetch detailed product information:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch product details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
