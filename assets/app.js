document.addEventListener('DOMContentLoaded', function () {
  const client = ZAFClient.init();
  client.invoke('resize', { width: '100%', height: '300px' });

  let originalCollaborators = [];

  client
    .get('ticket')
    .then(function (data) {
      const ticket = data.ticket;
      console.log('Full Ticket Data:', ticket);

      const requester = ticket.requester;
      originalCollaborators = ticket.collaborators || [];

      console.log('Requester Data:', requester);
      console.log('Collaborators Data:', originalCollaborators);

      // Ensure DOM elements exist before accessing
      const requesterAvatar = document.getElementById('requester-avatar');
      const requesterName = document.getElementById('requester-name');
      const requesterEmail = document.getElementById('requester-email');
      const ccSelect = document.getElementById('cc-select');

      if (!requesterAvatar || !requesterName || !requesterEmail || !ccSelect) {
        console.error('Missing required DOM elements.');
        return;
      }

      // Set requester avatar, name, and email
      requesterAvatar.src = requester.avatarUrl || 'default_avatar.png';
      requesterName.innerText = requester.name || 'Unknown Name';
      requesterEmail.innerText = requester.email || 'Unknown Email';

      // Populate collaborators select options
      if (originalCollaborators.length === 0) {
        console.log('No collaborators found for this ticket.');
      } else {
        originalCollaborators.forEach((collaborator) => {
          console.log('Processing Collaborator:', collaborator);
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
        console.error('Submit button handler: Missing required DOM elements.');
        return;
      }

      const newRequesterId = parseInt(ccSelect.value, 10);
      const keepOldRequester = keepOldRequesterCheckbox.checked;

      client.get('ticket').then(function (data) {
        const ticket = data.ticket;
        const requester = ticket.requester;

        if (!requester || !newRequesterId) {
          console.error('Invalid requester or newRequesterId.');
          return;
        }

        // Build the updated collaborators array
        let updatedCollaborators = originalCollaborators
          .filter((collaborator) => collaborator.id !== newRequesterId) // Exclude the new requester from collaborators
          .map((collaborator) => collaborator.id); // Convert to IDs

        // Add the old requester to collaborators if the checkbox is checked
        if (keepOldRequester) {
          if (!updatedCollaborators.includes(requester.id)) {
            updatedCollaborators.push(requester.id);
          }
        }

        // Debugging logs
        console.log('New Requester ID:', newRequesterId);
        console.log('Updated Collaborators:', updatedCollaborators);

        // Function to update the ticket
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
              client.invoke(
                'notify',
                'Requester updated successfully',
                'notice'
              );
            })
            .catch(function (error) {
              if (retries > 0) {
                console.warn('Retrying ticket update...', { retries, error });
                updateTicket(retries - 1);
              } else {
                console.error('Failed to update ticket:', error);
                client.invoke('notify', 'Failed to update requester', 'error');
              }
            });
        }

        updateTicket(); // Start update with retry logic
      });
    });
});
