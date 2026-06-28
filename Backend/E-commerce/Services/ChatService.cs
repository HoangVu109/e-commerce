using E_commerce.Data;
using E_commerce.DTOs.Chat;
using E_commerce.Models;
using E_commerce.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace E_commerce.Services
{
    public class ChatService : IChatService
    {
        private readonly AppDbContext _context;

        public ChatService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ChatMessageResponse> SendMessageAsync(Guid senderId, SendMessageRequest dto)
        {
            ChatSession session;

            if (dto.SessionId.HasValue)
            {
                session = await _context.ChatSessions
                    .Include(s => s.Customer)
                    .FirstOrDefaultAsync(s => s.Id == dto.SessionId.Value)
                    ?? throw new KeyNotFoundException("Session not found.");

                if (session.Status == ChatSessionStatus.Closed)
                    throw new InvalidOperationException("Cannot send message to a closed session.");
            }
            else
            {
                session = new ChatSession
                {
                    CustomerId = senderId,
                    Status = ChatSessionStatus.Open,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ChatSessions.Add(session);
                await _context.SaveChangesAsync();

                // reload with customer
                await _context.Entry(session).Reference(s => s.Customer).LoadAsync();
            }

            var message = new ChatMessage
            {
                SessionId = session.Id,
                SenderId = senderId,
                Content = dto.Content,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.ChatMessages.Add(message);
            session.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var sender = await _context.Users.FindAsync(senderId);

            return new ChatMessageResponse
            {
                Id = message.Id,
                SessionId = session.Id,
                SenderId = senderId,
                SenderName = sender?.FullName ?? sender?.Name ?? "Unknown",
                Content = message.Content,
                SentAt = message.SentAt,
                IsRead = false
            };
        }

        public async Task<List<ChatSessionResponse>> GetCustomerSessionsAsync(Guid customerId)
        {
            return await _context.ChatSessions
                .Include(s => s.Customer)
                .Include(s => s.Staff)
                .Where(s => s.CustomerId == customerId)
                .OrderByDescending(s => s.UpdatedAt)
                .Select(s => new ChatSessionResponse
                {
                    Id = s.Id,
                    CustomerId = s.CustomerId,
                    CustomerName = s.Customer.FullName ?? s.Customer.Name,
                    StaffId = s.StaffId,
                    StaffName = s.Staff != null ? (s.Staff.FullName ?? s.Staff.Name) : null,
                    Status = s.Status.ToString(),
                    LastMessage = s.Messages.OrderByDescending(m => m.SentAt)
                        .Select(m => m.Content).FirstOrDefault(),
                    LastMessageAt = s.Messages.OrderByDescending(m => m.SentAt)
                        .Select(m => (DateTime?)m.SentAt).FirstOrDefault(),
                    UnreadCount = s.Messages.Count(m => !m.IsRead && m.SenderId != customerId),
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<List<ChatSessionResponse>> GetAllSessionsAsync(string? status, Guid viewerId)
        {
            var query = _context.ChatSessions
                .Include(s => s.Customer)
                .Include(s => s.Staff)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(s => s.Status.ToString().ToLower() == status.ToLower());
            }

            return await query
                .OrderByDescending(s => s.UpdatedAt)
                .Select(s => new ChatSessionResponse
                {
                    Id = s.Id,
                    CustomerId = s.CustomerId,
                    CustomerName = s.Customer.FullName ?? s.Customer.Name,
                    StaffId = s.StaffId,
                    StaffName = s.Staff != null ? (s.Staff.FullName ?? s.Staff.Name) : null,
                    Status = s.Status.ToString(),
                    LastMessage = s.Messages.OrderByDescending(m => m.SentAt)
                        .Select(m => m.Content).FirstOrDefault(),
                    LastMessageAt = s.Messages.OrderByDescending(m => m.SentAt)
                        .Select(m => (DateTime?)m.SentAt).FirstOrDefault(),
                    UnreadCount = s.Messages.Count(m => !m.IsRead && m.SenderId != viewerId),
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<List<ChatMessageResponse>> GetSessionMessagesAsync(Guid sessionId)
        {
            return await _context.ChatMessages
                .Include(m => m.Sender)
                .Where(m => m.SessionId == sessionId)
                .OrderBy(m => m.SentAt)
                .Select(m => new ChatMessageResponse
                {
                    Id = m.Id,
                    SessionId = m.SessionId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.FullName ?? m.Sender.Name,
                    Content = m.Content,
                    SentAt = m.SentAt,
                    IsRead = m.IsRead
                })
                .ToListAsync();
        }

        public async Task<ChatSessionResponse> CloseSessionAsync(Guid sessionId, Guid staffId)
        {
            var session = await _context.ChatSessions
                .Include(s => s.Customer)
                .Include(s => s.Staff)
                .FirstOrDefaultAsync(s => s.Id == sessionId)
                ?? throw new KeyNotFoundException("Session not found.");

            if (session.Status == ChatSessionStatus.Closed)
                throw new InvalidOperationException("Session is already closed.");

            session.Status = ChatSessionStatus.Closed;
            session.StaffId = staffId;
            session.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new ChatSessionResponse
            {
                Id = session.Id,
                CustomerId = session.CustomerId,
                CustomerName = session.Customer.FullName ?? session.Customer.Name,
                StaffId = session.StaffId,
                StaffName = session.Staff?.FullName ?? session.Staff?.Name,
                Status = session.Status.ToString(),
                CreatedAt = session.CreatedAt
            };
        }

        public async Task MarkMessagesAsReadAsync(Guid sessionId, Guid userId)
        {
            var unread = await _context.ChatMessages
                .Where(m => m.SessionId == sessionId && !m.IsRead && m.SenderId != userId)
                .ToListAsync();

            foreach (var msg in unread)
            {
                msg.IsRead = true;
            }

            await _context.SaveChangesAsync();
        }
    }
}
