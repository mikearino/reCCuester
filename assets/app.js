document.addEventListener('DOMContentLoaded', function () {
  const client = ZAFClient.init();
  client.invoke('resize', { width: '100%', height: '300px' });

  client
    .get('ticket')
    .then(function (data) {
      const ticket = data.ticket;
      console.log('Full Ticket Data:', ticket);

      const requester = ticket.requester;
      const collaborators = ticket.collaborators || [];

      console.log('Requester Data:', requester);
      console.log('Collaborators Data:', collaborators);

      // Set requester avatar, name, and email
      if (requester.avatarUrl) {
        document.getElementById('requester-avatar').src = requester.avatarUrl;
      } else {
        document.getElementById('requester-avatar').src = 'default_avatar.png'; // Ensure this file exists in your assets
      }
      document.getElementById('requester-name').innerText = requester.name;
      document.getElementById('requester-email').innerText = requester.email;

      // Populate collaborators select options
      const ccSelect = document.getElementById('cc-select');
      if (collaborators.length === 0) {
        console.log('No collaborators found for this ticket.');
      } else {
        collaborators.forEach((collaborator) => {
          console.log('Processing Collaborator:', collaborator);
          const option = document.createElement('option');
          option.value = collaborator.id;
          option.text = collaborator.name;
          ccSelect.appendChild(option);
        });
      }
    })
    .catch(function (error) {
      console.error('Error fetching ticket data:', error);
    });

  document
    .getElementById('submit-button')
    .addEventListener('click', function () {
      const newRequesterId = document.getElementById('cc-select').value;
      const keepOldRequester =
        document.getElementById('keep-old-requester').checked;

      client.get('ticket').then(function (data) {
        const ticket = data.ticket;
        const requester = ticket.requester;

        client
          .request({
            url: `/api/v2/tickets/${ticket.id}.json`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
              ticket: {
                requester_id: newRequesterId,
                ...(keepOldRequester && { collaborator_ids: [requester.id] }),
              },
            }),
          })
          .then(function () {
            client.invoke('notify', 'Requester updated successfully', 'notice');
          })
          .catch(function () {
            client.invoke('notify', 'Failed to update requester', 'error');
          });
      });
    });
});
