import { Component, ViewChild } from '@angular/core';
import { ModalController, Navbar, NavController, NavParams } from 'ionic-angular';
import { WeeklyMenuModel } from "../../../../../model/WeeklyMenuModel";
import { WeeklyMenuDTO } from "../../../../../data/dto/menu/WeeklyMenuDTO";
import { MealModel } from "../../../../../model/MealModel";
import { MealDTO } from "../../../../../data/dto/menu/MealDTO";
import { UserDTO } from "../../../../../data/dto/user/UserDTO";
import { UserModel } from "../../../../../model/UserModel";
import { WeeklyMenu } from "../../../../../data/local/menu/WeeklyMenu";
import * as _ from "lodash";
import { WeeklyPlanModel } from "../../../../../model/WeeklyPlanModel";
import { WeeklyPlanDTO } from "../../../../../data/dto/menu/WeeklyPlanDTO";
import { MealComponent } from "../../meal/MealComponent";
import { ApplicationModel } from "../../../../../model/ApplicationModel";
import { GoogleAnalyticsModel } from "../../../../../model/GoogleAnalyticsModel";

@Component({
  selector: 'weekly-menu',
  templateUrl: 'WeeklyMenuComponent.html'
})
export class WeeklyMenuComponent {

  @ViewChild(Navbar)
  navbar: Navbar;

  weeklyMenuId: string;
  weeklyMenu: WeeklyMenu;

  private weeklyMenuDto: WeeklyMenuDTO;
  private weeklyPlanDto: WeeklyPlanDTO;

  public currentUser: UserDTO;

  favoriteMealsMap: { [key: string]: boolean };
  inCurrentPlanMealsMap: { [key: string]: boolean };

  constructor(public navCtrl: NavController,
              public modalCtrl: ModalController,
              public navParams: NavParams,
              public applicationModel: ApplicationModel,
              public weeklyMenuModel: WeeklyMenuModel,
              public weeklyPlanModel: WeeklyPlanModel,
              public mealModel: MealModel,
              public userModel: UserModel,
              public googleAnalyticsModel: GoogleAnalyticsModel) {

    this.currentUser = userModel.currentUser;
    this.weeklyMenuId = this.navParams.data.weeklyMenuId;
  }

  ionViewDidLoad() {
    this.init();

    this.googleAnalyticsModel.trackView('WEEKLY_MENU');

    this.navbar.backButtonClick = (event: UIEvent) => {
      this.navCtrl.pop({ animation: 'ios-transition'} );
    }
  }

  init() {
    this.getWeeklyMenuWithMeals()
      .catch(() => {});
    this.getCurrentWeeklyPlan()
      .catch(() => {});
  }

  silentReload() {
    this.currentUser = this.userModel.currentUser;

    this.applicationModel.suppressLoading = true;

    let getWeeklyMenuWithMealsFinished: boolean = false;
    let getCurrentWeeklyPlanFinished: boolean = false;

    this.getWeeklyMenuWithMeals()
      .then(() => {
        getWeeklyMenuWithMealsFinished = true;

        if (getWeeklyMenuWithMealsFinished && getCurrentWeeklyPlanFinished) {
          this.applicationModel.suppressLoading = false;
        }
      })
      .catch(() => {
        getWeeklyMenuWithMealsFinished = true;

        if (getWeeklyMenuWithMealsFinished && getCurrentWeeklyPlanFinished) {
          this.applicationModel.suppressLoading = false;
        }
      });

    this.getCurrentWeeklyPlan()
      .then(() => {
        getCurrentWeeklyPlanFinished = true;

        if (getWeeklyMenuWithMealsFinished && getCurrentWeeklyPlanFinished) {
          this.applicationModel.suppressLoading = false;
        }
      })
      .catch(() => {
        getCurrentWeeklyPlanFinished = true;

        if (getWeeklyMenuWithMealsFinished && getCurrentWeeklyPlanFinished) {
          this.applicationModel.suppressLoading = false;
        }
      });
  }

  getWeeklyMenuWithMeals(): Promise<WeeklyMenu> {
     return this.weeklyMenuModel.getWeeklyMenu(this.weeklyMenuId)
      .then((weeklyMenu: WeeklyMenuDTO) => {
        this.weeklyMenuDto = weeklyMenu;

        this.calculateFavoriteMealsMap(this.weeklyMenuDto.mealIds, this.currentUser.favoriteMealIds);

        if (this.weeklyMenuDto && this.weeklyPlanDto) {
          this.calculateInCurrentPlanMealsMap(this.weeklyMenuDto.mealIds, this.weeklyPlanDto.mealIds);
        }

        return this.mealModel.getMeals(weeklyMenu.mealIds)
          .then((meals: MealDTO[]) => {
            let weeklyMenuWithMeals: WeeklyMenu = WeeklyMenu.fromDTO(weeklyMenu);
            weeklyMenuWithMeals.meals = meals;

            this.weeklyMenu = weeklyMenuWithMeals;

            return this.weeklyMenu;
          })
          .catch((error) => {
            return Promise.reject(error);
          });
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  }

  getCurrentWeeklyPlan(): Promise<WeeklyPlanDTO> {
    return this.weeklyPlanModel.getCurrentWeeklyPlan(this.currentUser.id)
      .then((weeklyPlan: WeeklyPlanDTO) => {
        this.weeklyPlanDto = weeklyPlan;

        if (this.weeklyMenuDto && this.weeklyPlanDto) {
          this.calculateInCurrentPlanMealsMap(this.weeklyMenuDto.mealIds, this.weeklyPlanDto.mealIds);
        }

        return this.weeklyPlanDto;
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  }

  calculateFavoriteMealsMap(mealIds: string[], favoriteMealIds: string[]) {
    let favoriteMealsMap: { [key: string]: boolean } = {};

    _.forEach(mealIds, (mealId: string) => {
      favoriteMealsMap[mealId] = false;
    });

    _.forEach(favoriteMealIds, (favoriteMealId: string) => {
      favoriteMealsMap[favoriteMealId] = true;
    });

    this.favoriteMealsMap = favoriteMealsMap;
  }

  calculateInCurrentPlanMealsMap(mealIds: string[], weeklyPlanMealIds: string[]) {
    let inCurrentPlanMealsMap: { [key: string]: boolean } = {};

    _.forEach(mealIds, (mealId: string) => {
      inCurrentPlanMealsMap[mealId] = false;
    });

    _.forEach(weeklyPlanMealIds, (weeklyPlanMealId: string) => {
      inCurrentPlanMealsMap[weeklyPlanMealId] = true;
    });

    this.inCurrentPlanMealsMap = inCurrentPlanMealsMap;
  }

  toggleFavorite(meal: MealDTO, isFavorite: boolean) {
    this.userModel.toggleFavoriteMeal(meal.id, isFavorite)
      .then((user: UserDTO) => {
        this.currentUser = user;

        this.calculateFavoriteMealsMap(this.weeklyMenuDto.mealIds, this.currentUser.favoriteMealIds);
      })
      .catch((error) => {});
  }

  addMealToCurrentWeeklyPlan(meal: MealDTO) {
    this.weeklyPlanModel.addMealToWeeklyPlan(this.weeklyPlanDto, meal.id)
      .then((weeklyPlan: WeeklyPlanDTO) => {
        this.weeklyPlanDto = weeklyPlan;

        this.calculateInCurrentPlanMealsMap(this.weeklyMenuDto.mealIds, this.weeklyPlanDto.mealIds);
      })
      .catch((error) => {});
  }

  showMeal(meal: MealDTO) {
    let modal = this.modalCtrl.create(MealComponent, { mealId: meal.id });
    modal.onDidDismiss(data => {
      this.silentReload();
    });
    modal.present();
  }

}
