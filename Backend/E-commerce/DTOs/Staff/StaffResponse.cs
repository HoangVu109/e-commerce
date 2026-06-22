namespace E_commerce.DTOs.Staff
{
    public class StaffResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string? FullName { get; set; }
        public string PhoneNumber { get; set; }
        public decimal TotalSpend { get; set; }
        public string RoleName { get; set; }
    }
}
