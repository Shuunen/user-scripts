/* eslint-disable @typescript-eslint/naming-convention */

type LbcAdAttribute = {
  generic: boolean
  key_label?: string
  value: string
  value_label: string
  values: string[]
}

type LbcHousingAdAttribute = LbcAdAttribute & {
  key: 'district_id' | 'elevator' | 'energy_rate' | 'floor_number' | 'ges' | 'rooms' | 'square'
}

export type LbcCarAdAttribute = LbcAdAttribute & {
  key: 'ad_warranty_type' | 'brand' | 'doors' | 'fuel' | 'gearbox' | 'horse_power_din' | 'is_import' | 'issuance_date' | 'mileage' | 'model' | 'profile_picture_url' | 'regdate' | 'seats' | 'u_utility_brand' | 'u_utility_model' | 'vehicle_is_eligible_p2p' | 'vehicle_vsp' | 'vehicule_color'
}

export interface LbcAdImages {
  nb_images: number
  small_url: string
  thumb_url: string
  urls: string[]
  urls_large: string[]
  urls_thumb: string[]
}

export interface LbcAdLocationFeatureGeometry {
  coordinates: number[]
  type: string
}

export interface LbcAdLocationFeature {
  geometry: LbcAdLocationFeatureGeometry
  properties: null
  type: string
}

export interface LbcAdLocation {
  city: string
  city_label: string
  country_id: string
  department_id: string
  department_name: string
  feature: LbcAdLocationFeature
  is_shape: boolean
  lat: number
  lng: number
  provider: string
  region_id: string
  region_name: string
  source: string
  zipcode: string
}

export interface LbcAdOptions {
  booster: boolean
  gallery: boolean
  has_option: boolean
  photosup: boolean
  sub_toplist: boolean
  urgent: boolean
}

export interface LbcAdOwner {
  activity_sector: string
  name: string
  no_salesmen: boolean
  pro_rates_link: string
  siren: string
  store_id: string
  type: string
  user_id: string
}

export type LbcAd = {
  ad_type: string
  attributes: LbcCarAdAttribute[] | LbcHousingAdAttribute[]
  body: string
  brand: string
  category_id: string
  category_name: string
  district: string
  /**
   * DOM element of the ad, come from user script
   */
  element: HTMLElement
  first_publication_date: Date
  has_phone: boolean
  images: LbcAdImages
  index_date: Date
  list_id: number
  location: LbcAdLocation
  options: LbcAdOptions
  owner: LbcAdOwner
  price: number[]
  price_cents: number
  similar: null
  status: string
  subject: string
  url: string
}

export type LbcHousingAd = LbcAd & { attributes: LbcHousingAdAttribute[] }

export type LbcCarAd = LbcAd & { attributes: LbcCarAdAttribute[] }

export type IdbKeyvalGetter<Type> = (key: string) => Promise<Type | undefined>

export type LbcCustomInfo = {
  /**
   * info tailwind classes to enhance display & UX
   * @example ['bg-red-500', 'text-white']
  */
  classes?: string[]
  /**
   * a score between 0 (bad), 1 (normal) and 2 (super)
   */
  score?: number
  /**
   * info label/text to display
   */
  text?: string
}

export type LbcAdType = 'car' | 'housing' | 'unknown'
