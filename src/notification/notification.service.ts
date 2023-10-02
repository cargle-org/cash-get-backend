import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class NotificationService {
  constructor(private firebaseService: FirebaseService) {}

  async sendNotificationToOne(
    notification: {
      title: string;
      body: string;
    },
    data: any,
    tokens: string[],
  ) {
    const response = await this.firebaseService
      .messaging()
      .sendEachForMulticast({
        data,
        notification,
        tokens,
      });
    if (response.successCount > 0) {
      return true;
    } else {
      return false;
    }
  }

  async sendNotificationToAgents(
    notification: {
      title: string;
      body: string;
    },
    data: any,
  ) {
    const response = await this.firebaseService.messaging().send({
      data,
      notification,
      topic: 'agent',
    });
    return response;
  }

  async addToAgents(token: string[]) {
    this.firebaseService
      .messaging()
      .subscribeToTopic(token, 'agent')
      .then((response) => {
        console.log('Successfully subscribed to topic:', response);
      })
      .catch((error) => {
        console.log('Error subscribing to topic:', error);
      });
  }
}
