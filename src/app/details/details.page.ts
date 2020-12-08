import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventsService } from '../events.service';
import { Acknowledgement, EmergencyEvent, EventResponse } from '../interfaces';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {

  eventId: number
  eventResponse: EventResponse
  event: EmergencyEvent
  acknowledgements: Acknowledgement[] = []
  newNote = ''

  constructor(
    private route: ActivatedRoute, 
    private eventService: EventsService) { }

  async ngOnInit() {
    this.eventId = +this.route.snapshot.params['eventId']
    this.eventResponse = await this.eventService.getById(this.eventId).toPromise()
    this.event = this.eventResponse.event
    this.acknowledgements = await this.eventService.getAcknowledgements(this.eventResponse).toPromise()
  }

}
