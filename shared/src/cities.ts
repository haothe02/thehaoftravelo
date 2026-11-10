import { cityBounds, type CityBound } from "./cityBounds.ts";

export type CityId =
  | "ha-noi"
  | "ho-chi-minh"
  | "da-nang"
  | "hoi-an"
  | "hue"
  | "nha-trang"
  | "da-lat"
  | "phu-quoc"
  | "sa-pa"
  | "ha-long"
  | "ha-giang";

export type City = {
  id: CityId;
  nameVi: string;
  nameEn: string;
  /** [lng, lat] tourist center the camera flies to. */
  center: [number, number];
  zoom: number;
  aliases: readonly string[];
  introVi: string;
  introEn: string;
  bounds: CityBound;
};

const intro = {
  "ha-noi": {
    nameVi: "Hà Nội",
    nameEn: "Hanoi",
    center: [105.8516, 21.0338] as [number, number],
    zoom: 12.4,
    aliases: ["hanoi", "ha noi", "ha-noi", "thang long"],
    introVi:
      "Hà Nội nằm quanh hồ, với 36 phố phường và những quán mở từ rất sớm. Một bát phở, một ly cà phê và vài bước dưới tán cây là đủ để ngày bắt đầu. Chiều xuống, mặt hồ giữ đèn và tiếng người đi dạo.",
    introEn:
      "Hanoi sits around a lake, with the 36 streets of the Old Quarter and shops that open early. A bowl of phở, a coffee, and a short walk under the trees is enough to start the day. By late afternoon the water holds the lights and the sound of people strolling.",
  },
  "ho-chi-minh": {
    nameVi: "TP. Hồ Chí Minh",
    nameEn: "Ho Chi Minh City",
    center: [106.7009, 10.7769] as [number, number],
    zoom: 12.6,
    aliases: ["saigon", "sai gon", "hcm", "ho chi minh", "tp hcm", "tp.hcm"],
    introVi:
      "Sài Gòn đông, nóng và nhanh, nhưng bữa trưa của nhiều người vẫn nằm trong hẻm. Cà phê sữa đá, bánh mì và tiếng còi là nhịp quen. Tối đến, thành phố sáng dọc sông và quán mở đến khuya.",
    introEn:
      "Saigon is crowded, hot, and quick, yet a lot of lunch still happens in the side alleys. Iced coffee, bánh mì, and motorbike horns are the usual beat. At night the river lights up and the kitchens stay open late.",
  },
  "da-nang": {
    nameVi: "Đà Nẵng",
    nameEn: "Da Nang",
    center: [108.2208, 16.061] as [number, number],
    zoom: 12.3,
    aliases: ["danang", "da nang"],
    introVi:
      "Đà Nẵng có biển Mỹ Khê dài, sông Hàn và mấy cây cầu bắc ngang phố. Sáng có thể xuống nước, trưa ăn mì Quảng hoặc hải sản, chiều đi dọc bờ sông. Sân bay gần, thành phố dễ đi, đồ ăn đêm khá chắc.",
    introEn:
      "Da Nang has the long Mỹ Khê beach, the Hàn River, and bridges crossing the streets. Morning is for the water, midday for mì Quảng or seafood, afternoon for the riverbank. The airport is close, the city is easy to cross, and the night food is reliable.",
  },
  "hoi-an": {
    nameVi: "Hội An",
    nameEn: "Hoi An",
    center: [108.328, 15.8792] as [number, number],
    zoom: 12.7,
    aliases: ["hoian", "hoi an", "faifo"],
    introVi:
      "Hội An là phố cổ bên sông Thu Bồn, nhà vàng, đèn lồng và đường lát gạch. Đi bộ là đủ: một tô cao lầu, một ổ bánh mì, một quán vắng sau mưa. Tối đến, đèn thắp lên và khu phố cổ hạn chế xe máy.",
    introEn:
      "Hoi An is an old town on the Thu Bồn, with ochre houses, lanterns, and brick lanes. Walking covers it: a bowl of cao lầu, a bánh mì, a quiet café after rain. At dusk the lanterns come on and motorbikes leave the old streets.",
  },
  hue: {
    nameVi: "Huế",
    nameEn: "Hue",
    center: [107.5785, 16.4674] as [number, number],
    zoom: 13,
    aliases: ["hue", "thua thien"],
    introVi:
      "Huế nằm hai bên sông Hương, có kinh thành, chùa và bữa ăn thanh. Bún bò Huế, cơm hến và bánh bèo là lối vào đơn giản nhất. Sáng mát, trưa dịu hơn ngoài biển, chiều hợp đạp xe dọc bờ sông.",
    introEn:
      "Hue spreads along the Perfume River, with a citadel, pagodas, and a careful kitchen. Bún bò Huế, cơm hến, and bánh bèo are the simplest way in. Mornings are cool, middays softer than the coast, and the river path suits a bicycle.",
  },
  "nha-trang": {
    nameVi: "Nha Trang",
    nameEn: "Nha Trang",
    center: [109.1967, 12.2388] as [number, number],
    zoom: 12.8,
    aliases: ["nhatrang", "nha trang"],
    introVi:
      "Nha Trang là một vịnh cong, nước trong phần lớn năm và hải sản dọc bờ. Đường Trần Phú chạy theo biển, dễ đi bộ khi gió chiều lên. Một đảo gần, một lần tắm, rồi bữa tối đơn giản là lịch của nhiều người.",
    introEn:
      "Nha Trang is a curved bay, clear water for much of the year, and seafood along the shore. Trần Phú follows the beach and is an easy walk once the afternoon breeze starts. A nearby island, a swim, and a simple dinner is the day many people keep.",
  },
  "da-lat": {
    nameVi: "Đà Lạt",
    nameEn: "Da Lat",
    center: [108.4419, 11.9404] as [number, number],
    zoom: 12.8,
    aliases: ["dalat", "da lat"],
    introVi:
      "Đà Lạt cao hơn, mát, sương buổi sớm và thông hai bên dốc. Cà phê, bánh căn, rau và dâu là đồ ăn của thành phố này, không phải hải sản. Áo khoác mỏng có ích, và một khúc cua lạc thường mở ra hồ hoặc đồi.",
    introEn:
      "Da Lat sits higher: cool air, morning fog, and pines along the slopes. Coffee, bánh căn, vegetables, and strawberries belong here more than seafood. A light jacket helps, and a wrong turn often opens onto a lake or a hill.",
  },
  "phu-quoc": {
    nameVi: "Phú Quốc",
    nameEn: "Phu Quoc",
    center: [103.9595, 10.223] as [number, number],
    zoom: 11.6,
    aliases: ["phuquoc", "phu quoc"],
    introVi:
      "Phú Quốc là đảo lớn phía tây nam, bãi dài, hoàng hôn rộng và nước đổi màu theo từng bờ. Phía bắc vắng hơn; bờ tây có thị trấn Dương Đông và chợ đêm. Ở lại một bãi đến khi trời chuyển cam là đủ cho một ngày.",
    introEn:
      "Phu Quoc is a large island in the southwest, with long beaches, wide sunsets, and water that changes from shore to shore. The north is quieter; the west coast has Duong Dong town and a night market. Staying on one beach until the sky turns amber fills a day.",
  },
  "sa-pa": {
    nameVi: "Sa Pa",
    nameEn: "Sa Pa",
    center: [103.8438, 22.3364] as [number, number],
    zoom: 12.6,
    aliases: ["sapa", "sa pa"],
    introVi:
      "Sa Pa là thị trấn trên sườn Hoàng Liên Sơn, sát ruộng bậc thang và các bản. Sáng thường lạnh và có mây, trưa có thể nắng rất rõ. Một bát đồ nóng, rồi đi bộ xuống thung lũng, là nhịp hợp với nơi này.",
    introEn:
      "Sa Pa is a town on the Hoàng Liên Sơn slopes, beside terraces and villages. Mornings are often cold and cloudy; midday can turn suddenly bright. Something hot to eat, then a walk down into the valley, fits the place.",
  },
  "ha-long": {
    nameVi: "Hạ Long",
    nameEn: "Ha Long",
    center: [107.048, 20.951] as [number, number],
    zoom: 12.2,
    aliases: ["halong", "ha long", "vinh ha long", "hong gai", "bai chay"],
    introVi:
      "Hạ Long là thành phố ngay cạnh vịnh đá vôi. Bãi Cháy và Hòn Gai là phố trên bờ; vịnh bắt đầu khi ra thuyền. Hoàng hôn trên nước, rồi một bữa hải sản lúc về, là phần nhiều người nhớ nhất.",
    introEn:
      "Ha Long is the city beside the karst bay. Bai Chay and Hon Gai are the streets on shore; the bay starts when you board a boat. A sunset on the water, then seafood back on land, is the part most people remember.",
  },
  "ha-giang": {
    nameVi: "Hà Giang",
    nameEn: "Ha Giang",
    center: [104.982, 22.823] as [number, number],
    zoom: 13,
    aliases: ["hagiang", "ha giang"],
    introVi:
      "Hà Giang là cửa ngõ cực bắc, đèo cao, đá tai mèo và bản nằm trên sườn. Cung đường mở từng khúc cua, thung lũng hiện ra rất đột ngột. Đi chậm, trời đổi nhanh, và quán nhỏ ven đường thường là chỗ nghỉ đúng.",
    introEn:
      "Ha Giang is the far-north gate: high passes, jagged limestone, and villages on the slopes. The road opens bend by bend, and a valley appears all at once. Go slowly, the weather changes fast, and a small roadside kitchen is often the right stop.",
  },
} as const;

export const CITY_IDS = Object.keys(intro) as CityId[];

export const CITIES: City[] = CITY_IDS.map((id) => {
  const bounds = cityBounds[id];
  if (!bounds) throw new Error(`Missing bounds for ${id}`);
  return { id, ...intro[id], bounds };
});

const byId = new Map(CITIES.map((city) => [city.id, city]));

export function isCityId(value: string | null | undefined): value is CityId {
  return !!value && byId.has(value as CityId);
}

export function cityById(id: CityId): City {
  const city = byId.get(id);
  if (!city) throw new Error(`Unknown city ${id}`);
  return city;
}

export function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}

export function filterCities(query: string): City[] {
  const needle = fold(query);
  if (!needle) return CITIES;
  return CITIES.filter((city) => {
    const haystack = [city.id, city.nameVi, city.nameEn, ...city.aliases].map(fold);
    return haystack.some((item) => item.includes(needle));
  });
}
