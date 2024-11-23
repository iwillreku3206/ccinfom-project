/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-16 10:43:56
 * @ Modified time: 2024-11-23 12:16:52
 * @ Description:
 * 
 * Manages mapping listings to runtime objects.
 */

import type { QueryResult, RowDataPacket } from "mysql2";
import Model from "./model"

// The interface
export interface IListing {
  id: number,
  item: number,
  price: number,
  seller: number,
  list_date: Date,
  sold: number,
}

// Specs
type create_listing_spec = Omit<IListing, 'id' | 'list_date' | 'sold'>
type get_listing_spec = Partial<IListing>
type get_listing_by_game_spec = { game: number }

// The model queries
const create_listing_query = `INSERT INTO \`listings\` (item, price, seller) VALUES (?, ?, ?);`;
const get_listings_query = `SELECT * FROM \`listings\`;`;
const get_listing_by_item_query = `SELECT * FROM \`listings\` WHERE item = ?;`;
const get_listing_by_price_query = `SELECT * FROM \`listings\` WHERE price BETWEEN ? AND ?;`;
const get_listing_by_seller_query = `SELECT * FROM \`listings\` WHERE seller = ?;`;
const get_listing_by_list_date_query = `SELECT * FROM \`listings\` WHERE list_date BETWEEN ? AND ?;`;
const get_listing_by_game = `
  SELECT * FROM \`listings\` l 
    JOIN \`items\` i ON i.id = l.item 
    JOIN \`games\` g ON g.id = i.game 
    WHERE i.game = ?;`

// The model to use
export default class ListingModel extends Model {
  static #instance: ListingModel

  public static get instance(): ListingModel {
    if (!ListingModel.#instance) {
      ListingModel.#instance = new ListingModel()
    }

    return ListingModel.#instance
  }

  /**
   * Registers the queries and creates the instance.
   */
  private constructor() {
    super()
    super.register('create', create_listing_query, listing => [ listing.item, listing.price, listing.seller ])
    super.register('get-all', get_listings_query, _ => [])
    super.register('get-by-item', get_listing_by_item_query, listing => [ listing.item ])
    super.register('get-by-price', get_listing_by_price_query, listing => [ listing.min, listing.max ])
    super.register('get-by-seller', get_listing_by_seller_query, listing => [ listing.seller ])
    super.register('get-by-list-date', get_listing_by_list_date_query, listing => [ listing.min, listing.max ])
    super.register('get-by-game', get_listing_by_game, listing => [ listing.game ])
  }

  /**
   * Creates a new listing.
   * 
   * @param listing   A spec for the new listing to create. 
   */
  async createListing(listing: create_listing_spec): Promise<void> {
    await this.execute('create', listing)
  }

  /**
   * Retrieve all the listings.
   * 
   * @returns 
   */
  async getAllListings(): Promise<IListing[]> {
    let results = await super.execute<RowDataPacket[]>('get-all', {})
    return results.map((result: RowDataPacket) => (result as IListing))
  }

  /**
   * Retrieves a filtered version of the listings
   */
  async getFilteredListings(filter: string, ...values: any): Promise<IListing[] | null> {
    let results = null;

    switch(filter) {
      case 'item': results = await this.execute<RowDataPacket[]>('get-by-item', { item: values[0] }); break;
      case 'price': results = await this.execute<RowDataPacket[]>('get-by-price', { min: values[0], max: values[1] }); break;
      case 'seller': results = await this.execute<RowDataPacket[]>('get-by-seller', { seller: values[0] }); break;
      case 'list_date': results = await this.execute<RowDataPacket[]>('get-by-list-date', { min: values[0], max: values[1] }); break;
    }

    return results?.map((result: RowDataPacket) => (result as IListing)) ?? null;
  }

  /**
   * Return the listings associated with a game.
   */
  async getGameListings(listing: get_listing_by_game_spec): Promise<IListing[] | null> {
    const results = await this.execute<RowDataPacket[]>('get-by-game', listing)
    return results.map((r: RowDataPacket) => (r as IListing))
  }
}


