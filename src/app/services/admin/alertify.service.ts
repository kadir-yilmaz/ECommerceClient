import { Injectable } from '@angular/core';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';

@Injectable({
  providedIn: 'root'
})
export class AlertifyService {
  constructor(private toastrService: CustomToastrService) { }

  message(message: string, options: Partial<AlertifyOptions>) {
    // Map Alertify types to Toastr types
    let messageType: ToastrMessageType;
    switch (options.messageType) {
      case MessageType.Success: messageType = ToastrMessageType.Success; break;
      case MessageType.Error: messageType = ToastrMessageType.Error; break;
      case MessageType.Warning: messageType = ToastrMessageType.Warning; break;
      case MessageType.Message:
      case MessageType.Notify:
      default: messageType = ToastrMessageType.Info; break;
    }

    // Map Alertify positions to Toastr positions
    let position: ToastrPosition;
    switch (options.position) {
      case Position.TopCenter: position = ToastrPosition.TopCenter; break;
      case Position.TopLeft: position = ToastrPosition.TopLeft; break;
      case Position.BottomCenter: position = ToastrPosition.BottomCenter; break;
      case Position.BottomLeft: position = ToastrPosition.BottomLeft; break;
      case Position.BottomRight: position = ToastrPosition.BottomRight; break;
      case Position.BottomRight:
      default: position = ToastrPosition.BottomRight; break;
      case Position.TopRight: position = ToastrPosition.TopRight; break;
    }

    this.toastrService.message(message, "", {
      messageType: messageType,
      position: position
    });
  }

  dismiss() {
    // Toastr handles dismissal automatically or via its own service, 
    // but for compatibility we'll just let it be.
  }
}


export class AlertifyOptions {
  messageType: MessageType = MessageType.Message;
  position: Position = Position.BottomRight;
  delay: number = 3;
  dismissOthers: boolean = false;
}

export enum MessageType {
  Error = "error",
  Message = "message",
  Notify = "notify",
  Success = "success",
  Warning = "warning"
}

export enum Position {
  TopCenter = "top-center",
  TopRight = "top-right",
  TopLeft = "top-left",
  BottomRight = "bottom-right",
  BottomCenter = "bottom-center",
  BottomLeft = "bottom-left"
}