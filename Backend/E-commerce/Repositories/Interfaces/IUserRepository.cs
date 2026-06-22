using E_commerce.Models;

namespace E_commerce.Repositories.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<bool> IsEmailUniqueAsync(string email);
        Task<bool> IsPhoneNumberUniqueAsync(string phoneNumber, Guid? excludeUserId = null);
        Task AddAsync(User user);
        void Delete(User user);
        Task<bool> SaveChangesAsync();
        Task<User?> GetByIdAsync(Guid id);
    }
}
