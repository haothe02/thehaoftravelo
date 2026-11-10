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
      "Hồ Gươm, phố cổ và bát phở nóng lúc sáng sớm. Hà Nội đẹp khi đi chậm — một ghế vỉa hè, cà phê nhỏ, và tiếng thành phố thở.",
    introEn:
      "Sword Lake, the Old Quarter, and a hot bowl of phở before the city fully wakes. Hanoi rewards an unhurried stool and a slow coffee.",
  },
  "ho-chi-minh": {
    nameVi: "TP. Hồ Chí Minh",
    nameEn: "Ho Chi Minh City",
    center: [106.7009, 10.7769] as [number, number],
    zoom: 12.6,
    aliases: ["saigon", "sai gon", "hcm", "ho chi minh", "tp hcm", "tp.hcm"],
    introVi:
      "Sài Gòn ít khi thì thầm. Hẻm nhỏ, cà phê sữa đá, mái tôn bắt nắng. Đi bộ một đoạn, rồi để thành phố kéo bạn vào quán của người ở đây.",
    introEn:
      "Saigon rarely whispers. Alleys, iced coffee, tin roofs flashing in the sun. Walk a little, then let the city pull you into a neighbourhood place.",
  },
  "da-nang": {
    nameVi: "Đà Nẵng",
    nameEn: "Da Nang",
    center: [108.2208, 16.061] as [number, number],
    zoom: 12.3,
    aliases: ["danang", "da nang"],
    introVi:
      "Biển dài, cầu đẹp, đồ ăn đêm rất ổn. Tắm buổi sáng, rồi đi dọc sông Hàn khi đèn thành phố vừa lên.",
    introEn:
      "A long beach, handsome bridges, and night food worth the walk. Swim in the morning, then follow the Hàn River as the lights come on.",
  },
  "hoi-an": {
    nameVi: "Hội An",
    nameEn: "Hoi An",
    center: [108.328, 15.8792] as [number, number],
    zoom: 12.7,
    aliases: ["hoian", "hoi an", "faifo"],
    introVi:
      "Đèn lồng, tường vàng và hẻm mưa. Hội An hợp đi bộ chậm, một tô cao lầu, và nán lại đến khi phố tự thắp đèn.",
    introEn:
      "Lanterns, ochre walls, and lanes that shine after rain. Walk slowly, eat cao lầu, and stay until the town lights itself.",
  },
  hue: {
    nameVi: "Huế",
    nameEn: "Hue",
    center: [107.5785, 16.4674] as [number, number],
    zoom: 13,
    aliases: ["hue", "thua thien"],
    introVi:
      "Sông Hương, kinh thành, và bữa ăn thanh, hơi chậm. Ăn bún bò, rồi đạp xe dọc bờ sông khi nắng còn dịu.",
    introEn:
      "The Perfume River, a citadel, and a table that takes its time. Eat bún bò Huế, then cycle the riverbank while the light stays soft.",
  },
  "nha-trang": {
    nameVi: "Nha Trang",
    nameEn: "Nha Trang",
    center: [109.1967, 12.2388] as [number, number],
    zoom: 12.8,
    aliases: ["nhatrang", "nha trang"],
    introVi:
      "Vịnh xanh, hải sản, nắng gần như quanh năm. Một ngày biển, rồi buổi tối đi bộ dọc Trần Phú cho gió mặn vào tóc.",
    introEn:
      "A bright bay, seafood, and sun most of the year. Give it a full beach day, then an easy evening walk along the shore.",
  },
  "da-lat": {
    nameVi: "Đà Lạt",
    nameEn: "Da Lat",
    center: [108.4419, 11.9404] as [number, number],
    zoom: 12.8,
    aliases: ["dalat", "da lat"],
    introVi:
      "Sương sớm, thông và cà phê trong không khí mát. Đà Lạt dành cho áo khoác mỏng, một con dốc lạc, và ngồi lâu hơn dự định.",
    introEn:
      "Pine air, early fog, and coffee that invites a second cup. Cool mornings, a wrong turn up a hill, and staying longer than planned.",
  },
  "phu-quoc": {
    nameVi: "Phú Quốc",
    nameEn: "Phu Quoc",
    center: [103.9595, 10.223] as [number, number],
    zoom: 11.6,
    aliases: ["phuquoc", "phu quoc"],
    introVi:
      "Đảo lớn, hoàng hôn rộng, nước đổi màu theo từng bãi. Chọn một bờ biển và ở lại đến khi trời nhuộm cam.",
    introEn:
      "A big island, wide sunsets, and water that changes colour from beach to beach. Pick one shore and stay until the sky turns amber.",
  },
  "sa-pa": {
    nameVi: "Sa Pa",
    nameEn: "Sa Pa",
    center: [103.8438, 22.3364] as [number, number],
    zoom: 12.6,
    aliases: ["sapa", "sa pa"],
    introVi:
      "Thị trấn trên sườn núi, ruộng bậc thang, mây lúc ẩn lúc hiện. Sáng lạnh và một bát gì đó nóng là đủ để Sa Pa ở lại trong người.",
    introEn:
      "A mountain town, terraces cut into the slopes, and cloud that comes and goes. A cold morning and something hot to eat suits it.",
  },
  "ha-long": {
    nameVi: "Hạ Long",
    nameEn: "Ha Long",
    center: [107.048, 20.951] as [number, number],
    zoom: 12.2,
    aliases: ["halong", "ha long", "vinh ha long", "hong gai", "bai chay"],
    introVi:
      "Vịnh đá vôi ngay trước phố. Hạ Long là một chuyến thuyền, hoàng hôn trên vịnh, và bát hải sản khi lên bờ.",
    introEn:
      "Limestone karsts just beyond the streets. Ha Long is a boat, a sunset on the bay, and seafood once you are back on shore.",
  },
  "ha-giang": {
    nameVi: "Hà Giang",
    nameEn: "Ha Giang",
    center: [104.982, 22.823] as [number, number],
    zoom: 13,
    aliases: ["hagiang", "ha giang"],
    introVi:
      "Đèo cao, đá tai mèo, và những bản trên cung đường cực bắc. Hà Giang dành cho khúc cua chậm, bất ngờ mở ra cả một thung lũng.",
    introEn:
      "High passes, jagged limestone, and villages along the far-north road. Slow curves that suddenly open onto a whole valley.",
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
