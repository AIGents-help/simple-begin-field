export type ProductType = 'Fridge Magnet' | 'Wallet Card' | 'Sticker' | 'Keychain';

export interface QrDesign {
  id: string;
  name: string;
  product: ProductType;
  /** Product types the user can choose when ordering this design. */
  availableProducts: ProductType[];
  /** Width/height of the SVG preview in px. */
  width: number;
  height: number;
}

export const QR_DESIGNS: QrDesign[] = [
  { id: 'classic',      name: 'The Classic',     product: 'Wallet Card',   availableProducts: ['Wallet Card'],                              width: 320, height: 200 },
  { id: 'midnight',     name: 'Midnight',        product: 'Fridge Magnet', availableProducts: ['Fridge Magnet', 'Sticker'],                 width: 200, height: 200 },
  { id: 'sunshine',     name: 'Sunshine',        product: 'Sticker',       availableProducts: ['Sticker', 'Fridge Magnet'],                 width: 200, height: 200 },
  { id: 'retro-diner',  name: 'Retro Diner',     product: 'Fridge Magnet', availableProducts: ['Fridge Magnet'],                            width: 200, height: 200 },
  { id: 'galaxy',       name: 'Galaxy',          product: 'Sticker',       availableProducts: ['Sticker', 'Fridge Magnet'],                 width: 200, height: 200 },
  { id: 'tropical',     name: 'Tropical',        product: 'Fridge Magnet', availableProducts: ['Fridge Magnet'],                            width: 200, height: 200 },
  { id: 'minimalist',   name: 'Minimalist Dot',  product: 'Sticker',       availableProducts: ['Sticker'],                                  width: 200, height: 200 },
  { id: 'pet-parent',   name: 'Pet Parent',      product: 'Fridge Magnet', availableProducts: ['Fridge Magnet', 'Sticker'],                 width: 200, height: 200 },
  { id: 'game-over',    name: 'Game Over',       product: 'Sticker',       availableProducts: ['Sticker'],                                  width: 200, height: 200 },
  { id: 'holiday',      name: 'Holiday',         product: 'Fridge Magnet', availableProducts: ['Fridge Magnet'],                            width: 200, height: 200 },
  { id: 'wallet-pro',   name: 'Wallet Pro',      product: 'Wallet Card',   availableProducts: ['Wallet Card'],                              width: 320, height: 200 },
  { id: 'haven-owl',    name: 'Haven Owl',       product: 'Keychain',      availableProducts: ['Keychain', 'Sticker'],                     width: 200, height: 200 },
];

export const PRODUCT_FILTERS: Array<'All' | ProductType> = [
  'All', 'Fridge Magnet', 'Wallet Card', 'Sticker', 'Keychain',
];

export const PRINTIFY_SHOP_URL = 'https://survivorpacket.printify.me';
