import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideFirestore, getFirestore, enableIndexedDbPersistence } from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpClientModule } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

export const MY_FORMATS = {
  parse: {
    dateInput: 'yyyy/MM/dd',
  },
  display: {
    dateInput: 'yyyy/MM/dd',
    monthYearLabel: 'yyyy年MM月',
    dateA11yLabel: 'yyyy/MM/dd',
    monthYearA11yLabel: 'yyyy年MM月',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      // オフライン永続化を有効化
      enableIndexedDbPersistence(firestore)
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('複数のタブで永続化が有効になっています');
          } else if (err.code === 'unimplemented') {
            console.warn('ブラウザが永続化をサポートしていません');
          }
        });
      return firestore;
    }),
    provideAnimations(),
    importProvidersFrom(
      MatProgressBarModule,
      HttpClientModule,
      MatNativeDateModule,
      AngularFireModule.initializeApp(environment.firebase),
      AngularFirestoreModule
    ),
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'ja-JP' }
  ]
};
