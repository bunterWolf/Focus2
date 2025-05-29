// Development tools for debugging
const { ipcRenderer } = require('electron');

window.__devMenu = {
  // Generate test heartbeats
  generateTestHeartbeats() {
    console.log('Generating test heartbeats...');
    return ipcRenderer.invoke('activity:generateTestHeartbeats')
      .then(() => {
        console.log('Test heartbeats generated successfully');
        
        // Wait 2 seconds and fetch day data
        setTimeout(() => {
          ipcRenderer.invoke('activity:getDayData', null)
            .then(dayData => {
              console.log('Day data after generating test heartbeats:', dayData);
              console.log('Heartbeats count:', dayData?.heartbeats?.length);
              console.log('Aggregated data present:', !!dayData?.aggregated);
              if (dayData?.aggregated) {
                console.log('Timeline events count:', dayData.aggregated.timelineOverview.length);
              }
            })
            .catch(err => console.error('Error fetching day data:', err));
        }, 2000);
      })
      .catch(err => console.error('Error generating test heartbeats:', err));
  }
};

console.log('Developer tools loaded. Run window.__devMenu.generateTestHeartbeats() in console to generate test data.');
