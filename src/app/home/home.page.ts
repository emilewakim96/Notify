import { ApplicationRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { concat, interval, Subscription } from 'rxjs';
import { EventsService } from '../events.service';
import { EventResponse } from '../interfaces';
import { Network } from '@ngx-pwa/offline'
import { SwUpdate, UpdateActivatedEvent, UpdateAvailableEvent } from '@angular/service-worker';
import { first } from 'rxjs/operators'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  events: EventResponse[] = []
  subscriptions: Subscription[] = []
  online$ = this.network.onlineChanges

  constructor(
    private eventService: EventsService, 
    private nav: NavController,
    private network: Network,
    private updater: SwUpdate,
    private appRef: ApplicationRef,
    private toastController: ToastController,
    private alertController: AlertController) {}

  ngOnInit(): void {
    this.subscriptions.push(this.eventService.getAll()
    .subscribe(e => this.events.push(e)))

    this.initUpdater()
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  getEvents(): EventResponse[] {
    return this.events.sort((a,b) => a.event.created > b.event.created ? -1 : 1)
  }

  details(response: EventResponse) {
    this.nav.navigateForward(`/details/${response.event.id}`)
  }

  initUpdater() {
    const updateInterval$ = interval(1 * 60 * 1000) // 1 minute
    const appIsStable$ = this.appRef.isStable.pipe(first(isStable => isStable === true));
    const appStableInterval$ = concat(appIsStable$, updateInterval$);

    this.subscriptions.push(this.updater.available.subscribe( (e) => this.onUpdateAvailable(e)))
    this.subscriptions.push(this.updater.activated.subscribe( (e) => this.onUpdateActivated(e)))
    this.subscriptions.push(appStableInterval$.subscribe(() => this.checkForUpdate()));
  }

  async checkForUpdate() {
    if (this.updater.isEnabled) {
      await this.updater.checkForUpdate()
    }
  }

  async onUpdateActivated(event: UpdateActivatedEvent) {
    await this.showToastMessage('Application updating.')
  }

  async onUpdateAvailable(event: UpdateAvailableEvent) {
    const updateMessage = event.available.appData["updateMessage"]
    console.log('A new version is available:', updateMessage)

    const alert = await this.alertController.create({
      header: 'Update Available!',
      message: 'A new version of the application is available.' + 
      `(Details: ${updateMessage})` +
      'Click OK to update now.',
      buttons: [
        {
          text: 'Not Now',
          role: 'cancel',
          cssClass: 'secondary',
          handler: async () => {
            this.showToastMessage('Update deferred')
          }
        }, {
          text: 'OK',
          handler: async () => {
            await this.updater.activateUpdate()
            window.location.reload()
          }
        }
      ]
    })

    await alert.present()
  }

  async showToastMessage(msg: string) {
    console.log(msg)
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      position: 'top',
    })

    toast.present()
  }
}
