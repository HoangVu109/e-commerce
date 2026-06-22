using E_commerce.Models;

namespace E_commerce.Repositories.Interfaces
{
    public interface IOrderRepository
    {
        Task<List<Order>> GetAll();
        Task<Order?> GetById(Guid id);
        Task<List<Order>> GetByUserId(Guid userId);
        Task AddOrder(Order order);
        Task<bool> SaveChanges();


    }
}
