/* eslint-disable @typescript-eslint/naming-convention */

export interface LbcAdAttribute {
  key: 'district_id' | 'elevator' | 'energy_rate' | 'floor_number' | 'ges' | 'rooms' | 'square'
  value: string
  values: string[]
  value_label: string
  generic: boolean
  key_label?: string
}

export interface LbcAdImages {
  thumb_url: string
  small_url: string
  nb_images: number
  urls: string[]
  urls_thumb: string[]
  urls_large: string[]
}

export interface LbcAdLocationFeatureGeometry {
  type: string
  coordinates: number[]
}

export interface LbcAdLocationFeature {
  type: string
  geometry: LbcAdLocationFeatureGeometry
  properties: null
}

export interface LbcAdLocation {
  country_id: string
  region_id: string
  region_name: string
  department_id: string
  department_name: string
  city_label: string
  city: string
  zipcode: string
  lat: number
  lng: number
  source: string
  provider: string
  is_shape: boolean
  feature: LbcAdLocationFeature
}

export interface LbcAdOptions {
  has_option: boolean
  booster: boolean
  photosup: boolean
  urgent: boolean
  gallery: boolean
  sub_toplist: boolean
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
  price_cents: number
  price: number[]
  similar: null
  status: string
  subject: string
  url: string
}

export type IdbKeyvalGetter<Type> = (key: string) => Promise<Type | undefined>
