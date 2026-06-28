using E_commerce.DTOs.Chat;

namespace E_commerce.Services.Interfaces
{
    public interface IChatService
    {
        Task<ChatMessageResponse> SendMessageAsync(Guid senderId, SendMessageRequest dto);
        Task<List<ChatSessionResponse>> GetCustomerSessionsAsync(Guid customerId);
        Task<List<ChatSessionResponse>> GetAllSessionsAsync(string? status, Guid viewerId);
        Task<List<ChatMessageResponse>> GetSessionMessagesAsync(Guid sessionId);
        Task<ChatSessionResponse> CloseSessionAsync(Guid sessionId, Guid staffId);
        Task MarkMessagesAsReadAsync(Guid sessionId, Guid userId);
    }
}
