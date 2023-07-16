/* eslint-disable @typescript-eslint/naming-convention */

export interface LbcAdAttribute {
  generic: boolean
  key: 'district_id' | 'elevator' | 'energy_rate' | 'floor_number' | 'ges' | 'rooms' | 'square'
  key_label?: string
  value: string
  value_label: string
  values: string[]
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

export interface LbcAd {
  ad_type: string
  attributes: LbcAdAttribute[]
  body: string
  brand: string
  category_id: string
  category_name: string
  district: string
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

export type IdbKeyvalGetter<Type> = (key: string) => Promise<Type | undefined>
