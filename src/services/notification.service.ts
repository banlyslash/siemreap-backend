import { LeaveRequest, LeaveRequestStatus, User } from '@/generated/client'
import { logger } from '@/utils/logger'

/**
 * Notification service for sending email notifications
 * In a real application, this would integrate with an email service
 * For now, we'll just log the notifications
 */
export class NotificationService {
  /**
   * Send a notification when a leave request is submitted
   */
  static async sendLeaveRequestSubmittedNotification(
    leaveRequest: LeaveRequest,
    user: User
  ): Promise<void> {
    logger.info(
      `[NOTIFICATION] Leave request submitted: ${leaveRequest.id} by ${user.firstName} ${user.lastName}`
    )
    
    // In a real application, this would send an email to the manager
    logger.info(
      `[EMAIL] To: Manager, Subject: New Leave Request from ${user.firstName} ${user.lastName}`
    )
  }

  /**
   * Send a notification when a leave request is approved by a manager
   */
  static async sendManagerApprovalNotification(
    leaveRequest: LeaveRequest,
    user: User,
    manager: User
  ): Promise<void> {
    logger.info(
      `[NOTIFICATION] Leave request approved by manager: ${leaveRequest.id}, Manager: ${manager.firstName} ${manager.lastName}`
    )
    
    // Notify the employee
    logger.info(
      `[EMAIL] To: ${user.email}, Subject: Your leave request has been approved by your manager`
    )
    
    // Notify HR
    logger.info(
      `[EMAIL] To: HR, Subject: Leave request from ${user.firstName} ${user.lastName} needs HR approval`
    )
  }

  /**
   * Send a notification when a leave request is rejected by a manager
   */
  static async sendManagerRejectionNotification(
    leaveRequest: LeaveRequest,
    user: User,
    manager: User
  ): Promise<void> {
    logger.info(
      `[NOTIFICATION] Leave request rejected by manager: ${leaveRequest.id}, Manager: ${manager.firstName} ${manager.lastName}`
    )
    
    // Notify the employee
    logger.info(
      `[EMAIL] To: ${user.email}, Subject: Your leave request has been rejected by your manager`
    )
  }

  /**
   * Send a notification when a leave request is approved by HR
   */
  static async sendHRApprovalNotification(
    leaveRequest: LeaveRequest,
    user: User,
    hr: User
  ): Promise<void> {
    logger.info(
      `[NOTIFICATION] Leave request approved by HR: ${leaveRequest.id}, HR: ${hr.firstName} ${hr.lastName}`
    )
    
    // Notify the employee
    logger.info(
      `[EMAIL] To: ${user.email}, Subject: Your leave request has been fully approved`
    )
    
    // Notify the manager
    if (leaveRequest.managerId) {
      logger.info(
        `[EMAIL] To: Manager, Subject: Leave request from ${user.firstName} ${user.lastName} has been approved by HR`
      )
    }
  }

  /**
   * Send a notification when a leave request is rejected by HR
   */
  static async sendHRRejectionNotification(
    leaveRequest: LeaveRequest,
    user: User,
    hr: User
  ): Promise<void> {
    logger.info(
      `[NOTIFICATION] Leave request rejected by HR: ${leaveRequest.id}, HR: ${hr.firstName} ${hr.lastName}`
    )
    
    // Notify the employee
    logger.info(
      `[EMAIL] To: ${user.email}, Subject: Your leave request has been rejected by HR`
    )
    
    // Notify the manager
    if (leaveRequest.managerId) {
      logger.info(
        `[EMAIL] To: Manager, Subject: Leave request from ${user.firstName} ${user.lastName} has been rejected by HR`
      )
    }
  }

  /**
   * Send a notification when a leave request is cancelled
   */
  static async sendCancellationNotification(
    leaveRequest: LeaveRequest,
    user: User
  ): Promise<void> {
    logger.info(
      `[NOTIFICATION] Leave request cancelled: ${leaveRequest.id} by ${user.firstName} ${user.lastName}`
    )
    
    // Notify the manager if they had approved it
    if (leaveRequest.managerId) {
      logger.info(
        `[EMAIL] To: Manager, Subject: Leave request from ${user.firstName} ${user.lastName} has been cancelled`
      )
    }
    
    // Notify HR if they were involved
    if (leaveRequest.status === LeaveRequestStatus.manager_approved) {
      logger.info(
        `[EMAIL] To: HR, Subject: Leave request from ${user.firstName} ${user.lastName} has been cancelled`
      )
    }
  }
}
