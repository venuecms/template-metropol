import { getProducts, getSite } from "@venuecms/sdk-next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { ListProduct } from "@/components/ListProduct";

export async function ProductsContent() {
  await connection();

  const [{ data: products }, { data: site }, t] = await Promise.all([
    getProducts({ limit: 4, orderBy: "createdAt", dir: "desc" }),
    getSite(),
    getTranslations("shop"),
  ]);

  if (!site) return null;

  const latestProducts = products?.records.slice(0, 4);

  return (
    <section className="py-20">
      <div className="grid grid-cols-2 gap-8 sm:max-w-full sm:grid-cols-4 xl:grid-cols-4">
        {latestProducts?.length
          ? latestProducts.map((product) => (
              <ListProduct
                key={product.slug}
                featured={true}
                product={product}
                site={site}
              />
            ))
          : t("no_products_found")}
      </div>
    </section>
  );
}
