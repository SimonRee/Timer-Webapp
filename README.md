# Timer Plus

Webapp mobile in HTML, CSS e JavaScript vanilla, ricreata dai riferimenti forniti. Nessun framework o backend richiesto.

## Avvio

Nel progetto esistente: `npm run dev`, quindi aprire l'indirizzo indicato da Vite. In alternativa servire la cartella con qualsiasi server HTTP statico. Il doppio clic su index.html non è supportato perché l'app usa moduli JavaScript.

`npm run build` copia l'app statica in `dist/`, mantenendo i percorsi relativi, il manifest e il service worker. Pubblicare `dist/` su un hosting HTTPS oppure pubblicare direttamente i file dell'app e la cartella assets. Node è solo uno strumento opzionale di sviluppo.

## Funzioni

- ROUND: preparazione, lavoro e riposo per più round, defaticamento; nessun riposo dopo l'ultimo round.
- Timer basato sui timestamp: pausa, ripresa, riavvio, recupero del tempo al ritorno da una scheda in background.
- Ingranaggio: modifica degli intervalli; icona circolare a destra: elenco workout.
- Selettori minuti/secondi e round: scorrimento touch, rotella, clic e frecce della tastiera. Fatto conferma, Indietro annulla.
- Workout: aggiunta, selezione, modifica e cancellazione con conferma. La lista iniziale è vuota. Dati e preferenze sono salvati nel localStorage del browser per il singolo sito: non sono sincronizzati fra browser o dispositivi. Cancellare i dati del sito cancella anche i workout.
- TABATA configurabile, CRONOMETRO con giri, ALTRO con suoni, vibrazione, schermo acceso.
- Font locali, icone SVG e cache offline dopo la prima visita. Installazione tramite il menu del browser, ove supportata; su iPhone usare Condividi → Aggiungi alla schermata Home.

Su iOS audio, vibrazione e wake lock dipendono dalle capacità e autorizzazioni del browser. Lo schermo bloccato può sospendere i segnali: il conteggio viene riallineato al ritorno nell'app. Ricaricare la pagina conserva configurazioni e selezione, ma riporta il timer all'inizio.

## File

- `index.html`: documento e metadati.
- `styles.css`: interfaccia responsive e font.
- `app.js`: schermate, interazioni, persistenza e segnali.
- `timer.js`: sequenza e motore temporale indipendente dal DOM.
- `assets/`: font, licenze e icona.
- `manifest.webmanifest`, `service-worker.js`: supporto installazione e offline.

## Verifiche

`npm test` esegue i test del motore con un orologio controllato: durata totale, confini delle fasi, pause, recupero dal background, fasi a zero e validazione.

`tests/browser.cjs` è il test di integrazione dell'ambiente di sviluppo locale, con Playwright e Microsoft Edge. Verifica undici viewport da 320×568 a 2560×1440, contenimento dei testi nei pannelli, larghezza completa del layout, selettori, creazione workout, persistenza, pausa, Tabata, impostazioni e cronometro. Le schermate di controllo sono in `tests/screenshots/`. I percorsi del runtime nel test sono specifici di questo computer.

L'interfaccia utilizza Zuume SemiBold (600), con Regular e Medium disponibili come pesi 400 e 500. I file del font sono stati forniti dall'utente e sono inclusi in assets per il caricamento locale e offline. Le dimensioni dei testi sono adattate al carattere condensato.


## Layout responsive

L’app usa tutta la larghezza disponibile. Su telefono il timer e la fase successiva sono impilati; su desktop e su schermi bassi in orizzontale sono affiancati. I testi dei pannelli si dimensionano in base allo spazio disponibile, mantenendo margini interni. La lista workout usa due colonne da tablet in su.

