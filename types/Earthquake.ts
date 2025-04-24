export default interface Earthquake {
  tarih: string,
  saat: string,
  enlem: string,
  boylam: string,
  derinlik_km: string,
  buyukluk: number,
  type: "md" | "ml" | "mw"
  konum: string,
  nitelik: string
}