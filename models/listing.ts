/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-16 10:43:56
 * @ Modified time: 2024-11-23 19:48:01
 * @ Description:
 * 
 * Manages mapping listings to runtime objects.
 */

import type { QueryResult, RowDataPacket } from "mysql2";
import Model from "./model"
import UserModel from "./user";

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
type listing_buy_spec = { id: number, buyer_id: number }
type get_listing_spec = Partial<IListing>
type get_listing_by_game_spec = { game: number }

// The model queries
const create_listing_query = `INSERT INTO \`listings\` (item, price, seller) VALUES (?, ?, ?);`;
const get_listings_query = `SELECT * FROM \`listings\`;`;
const get_listing_by_id_query = `SELECT * FROM \`listings\` WHERE id = ?;`;
const get_listing_by_item_query = `SELECT * FROM \`listings\` WHERE item = ?;`;
const get_listing_by_price_query = `SELECT * FROM \`listings\` WHERE price BETWEEN ? AND ?;`;
const get_listing_by_seller_query = `SELECT * FROM \`listings\` WHERE seller = ?;`;
const get_listing_by_list_date_query = `SELECT * FROM \`listings\` WHERE list_date BETWEEN ? AND ?;`;
const get_listing_by_game = `
  SELECT * FROM \`listings\` l 
    JOIN \`items\` i ON i.id = l.item 
    JOIN \`games\` g ON g.id = i.game 
    WHERE i.game = ?;`

const create_sold_listing_query = `
  INSERT INTO \`sold_listings\` 
    (listing, buyer) VALUES (?, ?);
`

const update_sold_listing_by_id_query = `
  UPDATE \`listings\`
    SET sold = 1
    WHERE id = ?;
`

const delete_listings_by_userid = `
  DELETE FROM \`listings\`
    WHERE seller = ?;
`

const market_price_report = `
  SELECT  i.name AS itemName,
          g.name AS gameName,
          l.price AS price,
          l.id AS id,
          l.list_date AS date
  FROM    listings l
  JOIN    items i
      ON  i.id = l.item
  JOIN    games g
      ON  g.id = i.game
  WHERE  YEAR(l.list_date) = ?
      AND i.id = ?;
`
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
    super.register('create', create_listing_query, listing => [listing.item, listing.price, listing.seller])
    super.register('get-all', get_listings_query, _ => [])
    super.register('get-by-id', get_listing_by_id_query, listing => [listing.id])
    super.register('get-by-item', get_listing_by_item_query, listing => [listing.item])
    super.register('get-by-price', get_listing_by_price_query, listing => [listing.min, listing.max])
    super.register('get-by-seller', get_listing_by_seller_query, listing => [listing.seller])
    super.register('get-by-list-date', get_listing_by_list_date_query, listing => [listing.min, listing.max])
    super.register('get-by-game', get_listing_by_game, listing => [listing.game])
    super.register('create-sold', create_sold_listing_query, sold => [sold.listing, sold.buyer])
    super.register('update-sold', update_sold_listing_by_id_query, sold => [sold.id])
    super.register('delete-listings-by-userid', delete_listings_by_userid, l => [l.userId])
    super.register('marketpricereport', market_price_report, l => [l.year, l.itemId])
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

    switch (filter) {
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

  async getListing(listing: get_listing_spec): Promise<IListing | null> {
    const listings = await this.execute<RowDataPacket[]>('get-by-id', listing);
    return listings.length ? listings[0] as IListing : null;
  }

  async buyListing(listing: listing_buy_spec) {
    
    // Get sold item
    const sold = await this.getListing({ id: listing.id })
    if(!sold) return;

    // Create sold entry
    await this.execute('create-sold', { listing: sold?.id, buyer: listing.buyer_id  })  
    
    // Mark as sold
    await this.execute('update-sold', { id: listing.id })

    // Subtracts the price of the item from the balance of the user
    await UserModel.instance.updateBalance({ id: listing.buyer_id, balance: sold.price })
  }

  /**
   * Deletes all listings of a user
   */
  async deleteAllListingsOfUser(userId: number): Promise<void> {
    await this.execute('delete-listings-by-userid', { userId })
  }

  async marketPriceReport(year: number, itemId: number): Promise<{ itemName: string, gameName: string, price: number, id: number }[]> {
    return await this.execute('marketpricereport', { year, itemId }) as { itemName: string, gameName: string, price: number, id: number }[]
  }
}


