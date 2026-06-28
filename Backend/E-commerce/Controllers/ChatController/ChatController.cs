using E_commerce.DTOs.Chat;
using E_commerce.Helpers;
using E_commerce.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace E_commerce.Controllers
{
    [Route("api/chat")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        private Guid GetUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
        }

        // GET /api/chat/sessions — Customer: lấy session của mình; Staff/Admin: lấy tất cả
        [HttpGet("sessions")]
        [Authorize]
        public async Task<IActionResult> GetSessions([FromQuery] string? status)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var isStaffOrAdmin = User.IsInRole("Staff") || User.IsInRole("Admin");

            if (isStaffOrAdmin)
            {
                var sessions = await _chatService.GetAllSessionsAsync(status, userId);
                return Ok(BaseResponse<List<ChatSessionResponse>>.Ok(sessions));
            }
            else
            {
                var sessions = await _chatService.GetCustomerSessionsAsync(userId);
                return Ok(BaseResponse<List<ChatSessionResponse>>.Ok(sessions));
            }
        }

        // GET /api/chat/sessions/{id}/messages
        [HttpGet("sessions/{id}/messages")]
        [Authorize]
        public async Task<IActionResult> GetMessages(Guid id)
        {
            try
            {
                var messages = await _chatService.GetSessionMessagesAsync(id);
                return Ok(BaseResponse<List<ChatMessageResponse>>.Ok(messages));
            }
            catch (KeyNotFoundException)
            {
                return NotFound(BaseResponse<string>.Fail("Session not found.", 404));
            }
        }

        // PATCH /api/chat/sessions/{id}/close
        [HttpPatch("sessions/{id}/close")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CloseSession(Guid id)
        {
            var staffId = GetUserId();
            if (staffId == Guid.Empty) return Unauthorized();

            try
            {
                var result = await _chatService.CloseSessionAsync(id, staffId);
                return Ok(BaseResponse<ChatSessionResponse>.Ok(result, "Session closed."));
            }
            catch (KeyNotFoundException)
            {
                return NotFound(BaseResponse<string>.Fail("Session not found.", 404));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(BaseResponse<string>.Fail(ex.Message, 400));
            }
        }
    }
}
