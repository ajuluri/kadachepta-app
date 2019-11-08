import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FirestoreService } from 'src/app/services/FirestoreService';
import { PlaylistGroup } from 'src/app/models/PlaylistGroup';
import { Playlist } from 'src/app/models/Playlist';
import { PlaylistPage } from '../playlist/playlist.page';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  playlistGroups: PlaylistGroup[] = [];
  playingTrack: any;

  loadedPlaylists = false;

  constructor(
    private firestoreService: FirestoreService,
    private modalCtrl: ModalController
  ) {}

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');

    this.getPlaylistGroups();
  }

  getPlaylistGroups(): void {
    this.firestoreService.getPlaylistGroups().then((result: any) => {
      this.playlistGroups = result.playlistGroups;

      this.playlistGroups.forEach(playlistGroup => {
        this.firestoreService
          .getPlaylistGroupPlaylists(playlistGroup)
          .then((result: any) => {
            playlistGroup.playlists = result.playlistGroupPlaylists;
          });
      });

      this.loadedPlaylists = true;
    });
  }

  goToPlaylist(playlist: Playlist) {
    const modal = this.modalCtrl.create(PlaylistPage, { playlist: playlist });
    modal.present();
  }
}