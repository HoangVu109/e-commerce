using E_commerce.DTOs.Staff;

namespace E_commerce.Services.Interfaces
{
    public interface IStaffService
    {
        Task<List<StaffResponse>> GetAllStaff();
        Task<StaffResponse> GetStaffById(Guid id);
        Task<string> CreateStaff(CreateStaff staff);
        Task<string> UpdateStaff(Guid id, UpdateStaff staff);
        Task<string> DeleteStaff(Guid id);
    }
}
