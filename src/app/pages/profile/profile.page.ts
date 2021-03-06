import { Component, NgZone, OnInit } from '@angular/core';
import { ActionSheetController, Events, LoadingController, ModalController, NavController } from '@ionic/angular';
import * as firebase from 'firebase';
import { AppModule } from 'src/app/app.module';
import { Song } from 'src/app/models/Song';
import { AudioService } from '../../services/AudioService';
import { AuthService } from '../../services/AuthService';
import { FirestoreService } from '../../services/FirestoreService';
import { AlbumPage } from '../album/album.page';
import { ArtistPage } from '../artist/artist.page';
import { LoginPage } from '../login/login.page';

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
  styleUrls: ['./profile.page.scss']
})

export class ProfilePage implements OnInit {
  user: firebase.User;

  recentlyPlayedSongs: Song[] = [];
  tracks: any[] = [];

  loadedSongs = false;

  constructor(
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private firestoreService: FirestoreService,
    private audioService: AudioService,
    private app: AppModule,
    private zone: NgZone,
    private events: Events
  ) {
    this.events.subscribe('updateSongIsPlaying', () => {
      this.updateSongIsPlaying();
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProfilePage');

    this.getRecentlyPlayed();
  }

  ionViewDidEnter() {
    console.log('ionViewDidEnter ProfilePage');

    this.updateSongIsPlaying();
  }

  updateSongIsPlaying() {
    if (this.loadedSongs && this.audioService.playingTrack() !== undefined) {
      this.recentlyPlayedSongs.forEach(song => {
        if (song.songId === this.audioService.playingTrack().songId) {
          song.isPlaying = true;
        } else {
          song.isPlaying = false;
        }
      });
    }
  }

  getRecentlyPlayed() {
    this.authService.afAuth.user.subscribe((user: firebase.User) => {
      if (!user) { return; }
      this.user = user;

      this.firestoreService
        .getRecentlyPlayed(this.user.uid)
        .then((result: any) => {
          this.recentlyPlayedSongs = result.recentlyPlayed;

          this.recentlyPlayedSongs.forEach(song => {
            const track = {
              src: song.songUrl,
              artist: song.artistName,
              title: song.name,
              art: song.albumPicture,
              preload: 'metadata', // tell the plugin to preload metadata such as duration for this track, set to 'none' to turn off
              songId: song.songId,
              artistId: song.artistId,
              albumId: song.albumId
            };

            this.tracks.push(track);
          });

          this.loadedSongs = true;
          this.updateSongIsPlaying();
        });
    });
  }

  playRecentSong(trackIndex: number) {
    if (this.audioService.setTracksAndPlay(this.tracks, trackIndex)) {
      this.firestoreService.addSongToRecentlyPlayed(
        this.user.uid,
        this.recentlyPlayedSongs[trackIndex]
      );

      this.updateSongIsPlaying();
    }
  }

  async songActionSheet(song: Song) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: song.name + ' ⚬ ' + song.artistName,
      buttons: [
        {
          text: 'View Album',
          role: 'viewAlbum',
          icon: 'md-musical-notes',
          handler: () => {
            this.gotToAlbum(song);
          }
        },
        {
          text: 'View Artist',
          role: 'viewArtist',
          icon: 'md-person',
          handler: () => {
            this.goToArtist(song);
          }
        }
      ]
    });

    return await actionSheet.present();
  }

  gotToAlbum(song: Song) {
    this.navCtrl.push(AlbumPage, { albumId: song.albumId });
  }

  goToArtist(song: Song) {
    this.navCtrl.push(ArtistPage, { artistId: song.artistId });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async signOut() {
    const loading = await this.loadingCtrl.create({
      spinner: 'bubbles',
      message: 'Logging out...'
    });

    loading.present();

    setTimeout(() => {
      loading.dismiss();
      this.audioService.stop();

      firebase
        .auth()
        .signOut()
        .then(() => {
          this.zone.run(() => {
            this.app.getRootNav().setRoot(LoginPage);
          });
        });
    }, 500);
  }
  ngOnInit() { }
}
