import { getStudentCatalog } from "@/app/actions/mahasiswa-katalog";
import KatalogClient from "./KatalogClient";

export default async function KatalogMahasiswaPage() {
  const books = await getStudentCatalog();

  return <KatalogClient books={books} />;
}