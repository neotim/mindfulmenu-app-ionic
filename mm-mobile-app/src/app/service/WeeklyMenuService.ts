import { Injectable } from '@angular/core';
import { plainToClass } from 'class-transformer';
import { WeeklyMenuDTO } from "../data/dto/weeklyMenu/WeeklyMenuDTO";
import { FirebaseManager } from "../util/FirebaseManager";
import firebase from "firebase";

@Injectable()
export class WeeklyMenuService {

  constructor(private firebaseManager: FirebaseManager) {
  }

  public getWeeklyMenu(weeklyMenuId: string): Promise<WeeklyMenuDTO> {
    return new Promise((resolve, reject) => {
      this.firebaseManager.firestore.collection('weeklyMenus').doc(weeklyMenuId).get()
        .then((documentSnapshot: firebase.firestore.DocumentSnapshot) => {
          let result: Object = this.firebaseManager.documentToObject(documentSnapshot);
          let data: WeeklyMenuDTO = plainToClass(WeeklyMenuDTO, result as Object);
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  public getWeeklyMenuByWeekNumber(weekNumber: number): Promise<WeeklyMenuDTO> {
    return new Promise((resolve, reject) => {
      this.firebaseManager.firestore.collection('weeklyMenus').where('weekNumber', '==', weekNumber).get()
        .then((querySnapshot: firebase.firestore.QuerySnapshot) => {
          let result: Object[] = this.firebaseManager.queryToObjectArray(querySnapshot);
          let data: WeeklyMenuDTO[] = plainToClass(WeeklyMenuDTO, result as Object[]);

          if (data.length === 1) {
            resolve(data[0]);
          }
          else {
            reject(null);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

}
