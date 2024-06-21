document.addEventListener("DOMContentLoaded", function(){
  const client = ZAFClient.init();
  client.invoke('resize', {width: '100%', height :'300px'});

  client.get('ticket').then(function(data) {
    const ticket = data.ticket;
    const requester = ticket.requester;
    const ccs = ticket.ccs;

    document.getElementById('requester-avatar').src = requester.photo.thumb_url;
    document.getElementById('requester-name').innerText = requester.name;
    document.getElementById('requester-email').innerText = requester.email;
  }