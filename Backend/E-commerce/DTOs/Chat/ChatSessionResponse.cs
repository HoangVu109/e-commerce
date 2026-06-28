namespace E_commerce.DTOs.Chat
{
    public class ChatSessionResponse
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public Guid? StaffId { get; set; }
        public string? StaffName { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? LastMessage { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
