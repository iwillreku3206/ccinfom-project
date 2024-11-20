/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-16 10:43:56
 * @ Modified time: 2024-11-19 16:44:04
 * @ Description:
 * 
 * Manages mapping listings to runtime objects.
 */

import { Model } from "./model"

// The interface
export interface IListing {
	id: number,
	item: number,
	price: number,
	seller: number,
	list_date: Date,
	sold: number,
}

// The model to use
export const Listing = Model()

// Specs
type create_listing_spec 	= Omit<IListing, 'id' | 'list_date' | 'sold'>
type get_listing_spec 		= Partial<IListing>

// The model queries
const create_listing_query 						= `INSERT INTO \`listings\` (item, price, seller) VALUES (?, ?, ?);`;
const get_listings_query 							= `SELECT * FROM \`listings\`;`;
const get_listing_by_item_query 			= `SELECT * FROM \`listings\` WHERE item = ?;`;
const get_listing_by_price_query 			= `SELECT * FROM \`listings\` WHERE price BETWEEN ? AND ?;`;
const get_listing_by_seller_query 		= `SELECT * FROM \`listings\` WHERE seller = ?;`;
const get_listing_by_list_date_query 	= `SELECT * FROM \`listings\` WHERE list_date BETWEEN ? AND ?;`;

// Register the queries
Listing
	.register('create', 						create_listing_query, 					(listing: create_listing_spec) => [ listing.item, listing.price, listing.seller ])
	.register('get-all', 						get_listings_query, 						(listing: get_listing_spec) => [])
	.register('get-by-item', 				get_listing_by_item_query,			(listing: get_listing_spec) => [ listing.item ])
	.register('get-by-price', 			get_listing_by_price_query, 		(listing: get_listing_spec) => [ listing.price])
	.register('get-by-seller', 			get_listing_by_seller_query, 		(listing: get_listing_spec) => [ listing.seller ])
	.register('get-by-list-date', 	get_listing_by_list_date_query,	(listing: get_listing_spec) => [ listing.list_date ])
