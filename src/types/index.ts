export interface ProductFilters{
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy: 'Price' | 'name' | 'createdAt';
    sortOrder: 'asc' | 'desc';
}