import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as firebase from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private firebaseApp: firebase.app.App;

  constructor(configService: ConfigService) {
    this.firebaseApp = firebase.initializeApp({
      credential: firebase.credential.cert({
        clientEmail: configService.get('FIREBASE_CLIENT_EMAIL'),
        privateKey: configService
          .get<string>('FIREBASE_PRIVATE_KEY')
          .replace(/\\n/g, '\n'),
        projectId: configService.get('FIREBASE_PROJECT_ID'),
      }),
      databaseURL: configService.get('FIREBASE_DATABASE_URL'),
    });
  }

  getAuth = (): firebase.auth.Auth => {
    return this.firebaseApp.auth();
  };

  firestore = (): firebase.firestore.Firestore => {
    return this.firebaseApp.firestore();
  };

  db = (): firebase.database.Database => {
    return this.firebaseApp.database();
  };
}
