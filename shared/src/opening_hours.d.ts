declare module "opening_hours" {
  export default class OpeningHours {
    constructor(value: string, nominatimJson?: unknown, mode?: unknown);
    getState(date?: Date): boolean;
  }
}
