using E_commerce.Models;

namespace E_commerce.Repositories.Interfaces
{
    public interface IStaffRepository
    {
        Task<List<User>> GetAllStaff();
        Task<User?> GetStaffById(Guid id);
        Task<bool> EmailExists(string email);
        Task<Role?> GetStaffRole();
        Task AddStaff(User staff);
        void DeleteStaff(User staff);
        void UpdateStaff(User staff);
        Task<bool> SaveChanges();
    }
}
