using E_commerce.DTOs.User;

namespace E_commerce.Services.Interfaces
{
    public interface IAdminUserService
    {
        Task<ServiceResponse<AdminCreateUserResponse>> CreateStaffOrAdminAsync(AdminCreateUserRequest dto);
    }
}
