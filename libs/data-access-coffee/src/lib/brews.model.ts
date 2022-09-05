import type { SanityDocument, SanityImageAssetDocument } from '@sanity/client';
export interface RawBrew extends SanityDocument {
	addIns: string[];
	brewPic: { asset: SanityImageAssetDocument };
	brewedOn: string;
	brewedWith: RawOrder;
	equipment: string[];
	/**
	 * grams of beans used
	 */
	in: number;
	/**
	 * total amount of water used
	 */
	out: number;
	name: string;
	/**
	 * text blocks
	 * TODO(caleb): transform into HTML
	 */
	info: any[];
	method: string;
	rating: '1' | '2' | '3' | '4' | '5';
}
export interface RawOrder extends SanityDocument {
	beans: RawBeans;
	name: string;
	/**
	 * in cents
	 */
	price: number;
	/**
	 * in grams
	 */
	weight: number;
	receivedOn: string;
}
export interface RawBeans extends SanityDocument {
	Seller: string;
	roaster: string;
	image: { asset: SanityImageAssetDocument };
	info: any[];
	url: string;
}
