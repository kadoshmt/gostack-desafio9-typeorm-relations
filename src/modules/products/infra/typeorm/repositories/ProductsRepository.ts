import { getRepository, Repository, In } from 'typeorm';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });
    await this.ormRepository.save(product);
    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });
    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findProducts = await this.ormRepository.find({
      where: { id: In(products.map(item => item.id)) },
    });

    if (findProducts.length !== products.length) {
      throw new AppError('One or more products was not found!');
    }
    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const updatedProducts: Product[] = [];
    products.forEach(async item => {
      const product = await this.ormRepository.findOne(item.id);

      if (product && item.quantity > 0) {
        if (item.quantity > product.quantity) {
          throw new AppError(
            `insufficient stock for product "${product.name}"`,
          );
        }
        product.quantity -= item.quantity;
        await this.ormRepository.save(product);
        updatedProducts.push(product);
      }
    });
    return updatedProducts;
  }
}

export default ProductsRepository;
