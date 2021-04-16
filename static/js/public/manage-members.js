import debounce from "../libs/debounce";

function filterMembers(STATE) {
  const filterMembersField = document.querySelector("#filter-members");

  filterMembersField.addEventListener(
    "keyup",
    debounce((e) => {
      const query = e.target.value.toLowerCase();
      let filteredMembers = STATE.updatedMembers.filter((member) => {
        return (
          member.displayname.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.username.toLowerCase().includes(query)
        );
      });

      if (!query) {
        filteredMembers = STATE.updatedMembers;
      }

      buildTable(filteredMembers, STATE);
    }),
    100
  );
}

function handleCheckboxChangeState(checkbox, originalMember, currentMember) {
  const role = checkbox.name;
  const stateBox = checkbox.nextElementSibling;

  if (checkbox.checked && !currentMember.roles.includes(role)) {
    currentMember.roles = currentMember.roles.concat(role);
  }

  if (!checkbox.checked && currentMember.roles.includes(role)) {
    currentMember.roles = currentMember.roles.filter((data) => {
      return data !== role;
    });
  }

  if (checkbox.checked && !originalMember.roles.includes(role)) {
    stateBox.classList.add("add");
    stateBox.classList.remove("remove");
  }

  if (!checkbox.checked && originalMember.roles.includes(role)) {
    stateBox.classList.add("remove");
    stateBox.classList.remove("add");
  }

  if (
    (checkbox.checked && originalMember.roles.includes(role)) ||
    (!checkbox.checked && !originalMember.roles.includes(role))
  ) {
    stateBox.classList.remove("add", "remove");
  }
}

function checkDirtyData(currentMember, originalMember) {
  return (
    JSON.stringify(currentMember.roles.sort()) !==
    JSON.stringify(originalMember.roles.sort())
  );
}

function getChangeCount(member, members) {
  const oldMember = members.find((data) => data.id === member.id);

  let numberOfChanges = 0;

  if (member.roles.length >= oldMember.roles.length) {
    numberOfChanges = member.roles.filter((x) => {
      return oldMember.roles.indexOf(x) === -1;
    }).length;
  } else {
    numberOfChanges = oldMember.roles.filter((x) => {
      return member.roles.indexOf(x) === -1;
    }).length;
  }

  return numberOfChanges;
}

function getChangesToggleText(changeCount) {
  if (!changeCount) {
    return "No changes";
  } else if (changeCount === 1) {
    return "1 change";
  } else {
    return `${changeCount} changes`;
  }
}

function buildTable(updatedMembers, STATE) {
  const tbody = document.querySelector("[data-js-members-table-body]");
  const template = document.querySelector(
    "[data-js-members-table-row-template]"
  );

  tbody.innerHTML = "";

  updatedMembers.forEach((member) => {
    const clone = template.content.cloneNode(true);
    const memberDisplayNameField = clone.querySelector(
      "[data-js-member-display-name]"
    );
    const memberEmailField = clone.querySelector("[data-js-member-email]");

    memberDisplayNameField.innerText = member.displayname;
    memberEmailField.innerText = member.email;

    const roleCheckboxes = clone.querySelectorAll("[data-js-role-checkbox]");
    roleCheckboxes.forEach((checkbox) => {
      checkbox.dataset.memberEmail = member.email;
      const role = checkbox.dataset.role;
      if (member.roles.includes(role)) {
        checkbox.checked = true;
      }

      const originalMember = STATE.members.find((data) => {
        return data.email === checkbox.dataset.memberEmail;
      });

      const currentMember = updatedMembers.find((data) => {
        return data.email === checkbox.dataset.memberEmail;
      });

      handleCheckboxChangeState(checkbox, originalMember, currentMember);
    });

    tbody.appendChild(clone);
  });

  handleEvents(STATE);
}

function handleEvents(STATE) {
  const roleCheckboxes = document.querySelectorAll("[data-js-role-checkbox]");
  const changesContainer = document.querySelector(
    "[data-js-changes-container]"
  );
  const revertChangesButton = changesContainer.querySelector(
    "[data-js-revert-change-button]"
  );

  roleCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const originalMember = STATE.members.find((data) => {
        return data.email === checkbox.dataset.memberEmail;
      });

      const currentMember = STATE.updatedMembers.find((data) => {
        return data.email === checkbox.dataset.memberEmail;
      });

      handleCheckboxChangeState(checkbox, originalMember, currentMember);

      currentMember.isDirty = checkDirtyData(originalMember, currentMember);
      STATE.dirtyData = STATE.updatedMembers.filter((data) => data.isDirty);
      STATE.changeCount = 0;

      STATE.dirtyData.forEach((member) => {
        STATE.changeCount += getChangeCount(member, STATE.members);
      });

      handleSaveChangesBar(STATE);
    });
  });

  revertChangesButton.addEventListener("click", () => {
    STATE.updatedMembers = STATE.members.map((member) => {
      return Object.assign({}, member);
    });
    STATE.dirtyData = [];
    STATE.changeCount = 0;
    buildTable(STATE.members, STATE);
    handleSaveChangesBar(STATE);
  });
}

function handleSaveChangesBar(STATE) {
  const changesContainer = document.querySelector(
    "[data-js-changes-container]"
  );
  const changesToggleText = document.querySelector(
    "[data-js-changes-toggle] span"
  );
  const saveChangesButton = changesContainer.querySelector(
    "[data-js-save-changes-button]"
  );
  const revertChangesButton = changesContainer.querySelector(
    "[data-js-revert-change-button]"
  );

  changesToggleText.innerText = getChangesToggleText(STATE.changeCount);
  saveChangesButton.disabled = STATE.changeCount < 1;
  revertChangesButton.disabled = STATE.changeCount < 1;
  saveChangesButton.disabled = STATE.changeCount < 1;
  revertChangesButton.disabled = STATE.changeCount < 1;

  if (STATE.changeCount > 0) {
    changesContainer.classList.add("p-sticky-admin-footer");
    changesContainer.classList.remove("p-sticky-admin-footer--hidden");
  } else {
    changesContainer.classList.add("p-sticky-admin-footer--hidden");
    changesContainer.classList.remove("p-sticky-admin-footer");
  }
}

function initManageMembersTable(members) {
  const STATE = {
    members,
    updatedMembers: members.map((member) => {
      return Object.assign({}, member);
    }),
    dirtyData: [],
    changeCount: 0,
  };

  const manageMembersForm = document.getElementById("manage-members-form");

  buildTable(STATE.updatedMembers, STATE);
  filterMembers(STATE);

  manageMembersForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const form = event.target;
    const membersField = manageMembersForm.querySelector(
      "[data-js-members-hidden-field]"
    );

    membersField.value = JSON.stringify(
      STATE.dirtyData.map((data) => {
        return {
          email: data.email,
          roles: data.roles,
        };
      })
    );

    form.submit();
  });
}

export { initManageMembersTable };
