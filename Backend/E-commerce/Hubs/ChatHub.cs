using System.Security.Claims;
using E_commerce.DTOs.Chat;
using E_commerce.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace E_commerce.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(IChatService chatService, ILogger<ChatHub> logger)
        {
            _chatService = chatService;
            _logger = logger;
        }

        private Guid GetUserId()
        {
            var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
        }

        private bool IsStaffOrAdmin()
            => Context.User?.IsInRole("Staff") == true || Context.User?.IsInRole("Admin") == true;

        public override async Task OnConnectedAsync()
        {
            if (IsStaffOrAdmin())
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "StaffGroup");
                _logger.LogInformation("Staff connected: {UserId}", GetUserId());
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (IsStaffOrAdmin())
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "StaffGroup");
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinSession(Guid sessionId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"session_{sessionId}");
        }

        public async Task LeaveSession(Guid sessionId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"session_{sessionId}");
        }

        public async Task SendMessage(SendMessageRequest dto)
        {
            var senderId = GetUserId();
            _logger.LogInformation("SendMessage called: sender={SenderId}, sessionId={SessionId}, content={Content}",
                senderId, dto.SessionId, dto.Content);
            if (senderId == Guid.Empty) return;

            try
            {
                var msg = await _chatService.SendMessageAsync(senderId, dto);

                // Nếu là session mới (dto.SessionId null), thêm caller vào group
                if (!dto.SessionId.HasValue)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"session_{msg.SessionId}");
                }

                // Broadcast tin nhắn đến tất cả trong session group
                await Clients.Group($"session_{msg.SessionId}").SendAsync("ReceiveMessage", msg);

                // Nếu là session mới, thông báo cho tất cả staff
                if (!dto.SessionId.HasValue)
                {
                    await Clients.Group("StaffGroup").SendAsync("NewSession", new { sessionId = msg.SessionId });
                }

                // Luôn thông báo cho staff group để refresh session list
                await Clients.Group("StaffGroup").SendAsync("SessionUpdated", new { sessionId = msg.SessionId });
            }
            catch (KeyNotFoundException)
            {
                await Clients.Caller.SendAsync("Error", "Session not found.");
            }
            catch (InvalidOperationException ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
        }

        public async Task CloseSession(Guid sessionId)
        {
            var staffId = GetUserId();
            if (staffId == Guid.Empty) return;

            try
            {
                var session = await _chatService.CloseSessionAsync(sessionId, staffId);

                await Clients.Group($"session_{sessionId}").SendAsync("SessionClosed", new
                {
                    sessionId,
                    status = "Closed",
                    staffName = session.StaffName
                });

                // Cũng thông báo cho tất cả staff
                await Clients.Group("StaffGroup").SendAsync("SessionUpdated", new { sessionId });
            }
            catch (KeyNotFoundException)
            {
                await Clients.Caller.SendAsync("Error", "Session not found.");
            }
            catch (InvalidOperationException ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
        }

        public async Task MarkRead(Guid sessionId)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return;

            await _chatService.MarkMessagesAsReadAsync(sessionId, userId);
        }
    }
}
