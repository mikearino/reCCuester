document.addEventListener('DOMContentLoaded', function () {
  const client = ZAFClient.init();
  client.invoke('resize', { width: '100%', height: '300px' });

  let originalCollaborators = [];

  client
    .get('ticket')
    .then(function (data) {
      const ticket = data.ticket;
      const requester = ticket.requester;
      originalCollaborators = ticket.collaborators || [];

      const requesterAvatar = document.getElementById('requester-avatar');
      const requesterName = document.getElementById('requester-name');
      const requesterEmail = document.getElementById('requester-email');
      const ccSelect = document.getElementById('cc-select');

      if (!requesterAvatar || !requesterName || !requesterEmail || !ccSelect) {
        return;
      }

      requesterAvatar.src = requester.avatarUrl || 'default_avatar.png';
      requesterName.innerText = requester.name || 'Unknown Name';
      requesterEmail.innerText = requester.email || 'Unknown Email';

      if (originalCollaborators.length === 0) {
        const option = document.createElement('option');
        option.text = 'No collaborators available';
        option.disabled = true;
        ccSelect.appendChild(option);
      } else {
        originalCollaborators.forEach((collaborator) => {
          const option = document.createElement('option');
          option.value = collaborator.id;
          option.text = collaborator.name || collaborator.email || 'Unknown';
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
      const ccSelect = document.getElementById('cc-select');
      const keepOldRequesterCheckbox = document.getElementById('keep-old-requester');

      if (!ccSelect || !keepOldRequesterCheckbox) {
        return;
      }

      const newRequesterId = parseInt(ccSelect.value, 10);
      const keepOldRequester = keepOldRequesterCheckbox.checked;

      client.get('ticket').then(function (data) {
        const ticket = data.ticket;
        const requester = ticket.requester;

        if (!requester || !newRequesterId) {
          return;
        }

        let updatedCollaborators = originalCollaborators
          .filter((collaborator) => collaborator.id !== newRequesterId)
          .map((collaborator) => collaborator.id);

        if (keepOldRequester) {
          if (!updatedCollaborators.includes(requester.id)) {
            updatedCollaborators.push(requester.id);
          }
        }

        function updateTicket(retries = 3) {
          client
            .request({
              url: `/api/v2/tickets/${ticket.id}.json`,
              type: 'PUT',
              contentType: 'application/json',
              data: JSON.stringify({
                ticket: {
                  requester_id: newRequesterId,
                  collaborator_ids: updatedCollaborators,
                },
              }),
            })
            .then(function () {
              client.invoke('notify', 'Requester updated successfully!', 'notice');

              client.request({
                url: `/api/v2/tickets/${ticket.id}.json`,
                type: 'GET',
              });
            })
            .catch(function (error) {
              if (retries > 0) {
                updateTicket(retries - 1);
              } else {
                client.invoke('notify', 'Failed to update requester.', 'error');
              }
            });
        }

        updateTicket();
      });
    });
});
