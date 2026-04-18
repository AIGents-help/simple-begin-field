import { CategoryOption } from '../components/upload/types';

export const PROPERTY_CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'Jewelry & Watches', label: 'Jewelry & Watches' },
  { value: 'Art & Paintings', label: 'Art & Paintings' },
  { value: 'Collectibles & Memorabilia', label: 'Collectibles & Memorabilia' },
  { value: 'Firearms & Weapons', label: 'Firearms & Weapons' },
  { value: 'Musical Instruments', label: 'Musical Instruments' },
  { value: 'Sports Equipment', label: 'Sports Equipment' },
  { value: 'Hobby Equipment', label: 'Hobby Equipment' },
  { value: 'Antiques & Furniture', label: 'Antiques & Furniture' },
  { value: 'Electronics & Technology', label: 'Electronics & Technology' },
  { value: 'Vehicles (non-titled)', label: 'Vehicles (non-titled — ATVs, boats, motorcycles)' },
  { value: 'Coins & Currency', label: 'Coins & Currency' },
  { value: 'Wine & Spirits', label: 'Wine & Spirits' },
  { value: 'Books & Manuscripts', label: 'Books & Manuscripts' },
  { value: 'Other', label: 'Other' },
];

export const PROPERTY_CATEGORIES = PROPERTY_CATEGORY_OPTIONS.map((o) => o.value);

export const PROPERTY_CONDITIONS = ['Mint', 'Excellent', 'Good', 'Fair', 'Poor'];

export const PROPERTY_ACQUISITION_METHODS = ['Purchased', 'Inherited', 'Gifted', 'Found', 'Other'];

export const PROPERTY_DISPOSITION_ACTIONS = [
  'Sell',
  'Keep in family',
  'Donate',
  'Auction',
  'Destroy / discard',
  'Per my Will',
];

export const PROPERTY_SELLING_METHODS = [
  'Private sale',
  'Auction',
  'Estate sale',
  'Online marketplace',
];
