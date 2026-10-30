const categories = ["All", "Music", "Workshop", "Sports", "Food", "Art", "Tech"];

let events = [];
let bookings = [];
let selectedCategory = "All";
let selectedEvent = null; // the event user is currently booking



function getEl(id) {
  return document.getElementById(id);
}


function getFutureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date, time) {
  const d = new Date(date + "T" + time);
  const datePart = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const timePart = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return datePart + ", " + timePart;
}

function formatPrice(amount) {
  if (amount === 0) {
    return "Free";
  }
  return "₹" + amount.toLocaleString("en-IN");
}

// stops user text from being treated as HTML
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message) {
  const toast = getEl("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
  }, 2500);
}


// ---------- Saving and loading data ----------

function saveData() {
  try {
    localStorage.setItem("nukkad_events", JSON.stringify(events));
    localStorage.setItem("nukkad_bookings", JSON.stringify(bookings));
  } catch (error) {
    console.log("Could not save data", error);
  }
}

function loadData() {
  try {
    const savedEvents = localStorage.getItem("nukkad_events");
    const savedBookings = localStorage.getItem("nukkad_bookings");
    if (savedEvents) {
      events = JSON.parse(savedEvents);
    }
    if (savedBookings) {
      bookings = JSON.parse(savedBookings);
    }
  } catch (error) {
    console.log("Could not load data", error);
  }

  // first time the site opens, add some sample events
  if (events.length === 0) {
    events = getSampleEvents();
    saveData();
  }
}

function getSampleEvents() {
  return [
    {
      id: "e1", title: "Acoustic open mic night", category: "Music",
      date: getFutureDate(2), time: "18:30", venue: "The Chai Loft, Model Town",
      price: 150, seats: 40, sold: 12,
      description: "Sign up to perform or just come to listen. Tea and snacks on sale."
    },
    {
      id: "e2", title: "Pottery for beginners", category: "Workshop",
      date: getFutureDate(4), time: "11:00", venue: "Clay Corner Studio",
      price: 600, seats: 12, sold: 9,
      description: "Make your own bowl on the wheel. All materials included."
    },
    {
      id: "e3", title: "5-a-side football cup", category: "Sports",
      date: getFutureDate(6), time: "07:00", venue: "City Turf Ground",
      price: 300, seats: 60, sold: 60,
      description: "Knockout format. Register your whole team in one booking."
    },
    {
      id: "e4", title: "Street food walk", category: "Food",
      date: getFutureDate(9), time: "17:00", venue: "Meets at Clock Tower",
      price: 250, seats: 20, sold: 7,
      description: "Taste seven local favourites with a guide who knows every cart."
    },
    {
      id: "e5", title: "Build your first website", category: "Tech",
      date: getFutureDate(12), time: "10:00", venue: "Co-work Hub, 2nd floor",
      price: 0, seats: 25, sold: 10,
      description: "A hands-on HTML, CSS and JavaScript session for students."
    }
  ];
}


// ---------- Showing things on the page ----------

// switch between Events / Host / My tickets
function showSection(sectionId) {
  const sections = ["events-section", "host-section", "tickets-section"];
  for (let i = 0; i < sections.length; i++) {
    getEl(sections[i]).classList.add("hidden");
  }
  getEl(sectionId).classList.remove("hidden");

  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(function (button) {
    if (button.dataset.section === sectionId) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });

  window.scrollTo(0, 0);
}

function renderCategoryButtons() {
  let html = "";
  categories.forEach(function (name) {
    let extraClass = "";
    if (name === selectedCategory) {
      extraClass = " selected";
    }
    html += '<button class="category-btn' + extraClass + '" data-category="' + name + '">' + name + "</button>";
  });
  getEl("category-buttons").innerHTML = html;
}

function renderEvents() {
  const searchText = getEl("search-box").value.trim().toLowerCase();
  const today = getFutureDate(0);

  // keep only upcoming events that match the search and category
  const filtered = events.filter(function (event) {
    const isUpcoming = event.date >= today;
    const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
    const allText = (event.title + " " + event.venue + " " + event.description).toLowerCase();
    return isUpcoming && matchesCategory && allText.includes(searchText);
  });

  // sort by date, earliest first
  filtered.sort(function (a, b) {
    return (a.date + a.time).localeCompare(b.date + b.time);
  });

  if (filtered.length === 0) {
    getEl("events-list").innerHTML =
      '<div class="empty-message">No events found. Try another category or host your own.</div>';
    return;
  }

  let html = "";
  filtered.forEach(function (event) {
    const seatsLeft = event.seats - event.sold;
    const soldOut = seatsLeft <= 0;

    html += '<div class="card">';
    html += '  <div class="card-body">';
    html += '    <span class="tag">' + escapeHTML(event.category) + "</span>";
    html += "    <h3>" + escapeHTML(event.title) + "</h3>";
    html += '    <p class="card-info">' + formatDateTime(event.date, event.time) + "</p>";
    html += '    <p class="card-info">' + escapeHTML(event.venue) + "</p>";
    html += '    <p class="card-desc">' + escapeHTML(event.description) + "</p>";
    if (event.mine) {
      html += '    <button class="link-btn" data-delete="' + event.id + '">Remove my event</button>';
    }
    html += "  </div>";
    html += '  <div class="card-footer">';
    html += '    <span class="price">' + formatPrice(event.price) + "</span>";
    html += '    <button class="btn" data-book="' + event.id + '"' + (soldOut ? " disabled" : "") + ">";
    html += soldOut ? "Sold out" : "Book now";
    html += "    </button>";
    html += '    <span class="seats-left">' + (soldOut ? "No seats left" : seatsLeft + " seats left") + "</span>";
    html += "  </div>";
    html += "</div>";
  });

  getEl("events-list").innerHTML = html;
}

function renderTickets() {
  // show number of tickets next to "My tickets"
  if (bookings.length > 0) {
    getEl("ticket-count").textContent = "(" + bookings.length + ")";
  } else {
    getEl("ticket-count").textContent = "";
  }

  if (bookings.length === 0) {
    getEl("tickets-list").innerHTML =
      '<div class="empty-message">No tickets yet. Book an event and it will show up here.</div>';
    return;
  }

  let html = "";
  bookings.forEach(function (booking) {
    html += '<div class="card">';
    html += '  <div class="card-body">';
    html += '    <span class="tag">' + booking.code + "</span>";
    html += "    <h3>" + escapeHTML(booking.title) + "</h3>";
    html += '    <p class="card-info">' + formatDateTime(booking.date, booking.time) + "</p>";
    html += '    <p class="card-info">' + escapeHTML(booking.venue) + "</p>";
    html += '    <p class="card-desc">' + escapeHTML(booking.name) + ", " + booking.qty +
            " ticket(s), paid by " + escapeHTML(booking.payment) + "</p>";
    html += '    <button class="link-btn" data-cancel="' + booking.code + '">Cancel booking</button>';
    html += "  </div>";
    html += '  <div class="card-footer">';
    html += '    <span>Total</span>';
    html += '    <span class="price">' + formatPrice(booking.total) + "</span>";
    html += "  </div>";
    html += "</div>";
  });

  getEl("tickets-list").innerHTML = html;
}


// ---------- Booking an event ----------

function updateBookingTotal() {
  let qty = parseInt(getEl("book-qty").value);
  if (isNaN(qty) || qty < 1) {
    qty = 1;
  }
  getEl("book-total").textContent = formatPrice(selectedEvent.price * qty);
}

function openBookingForm(eventId) {
  selectedEvent = events.find(function (event) {
    return event.id === eventId;
  });
  if (!selectedEvent) {
    return;
  }

  const seatsLeft = selectedEvent.seats - selectedEvent.sold;

  getEl("book-title").textContent = selectedEvent.title;
  getEl("book-info").textContent =
    formatDateTime(selectedEvent.date, selectedEvent.time) + ", " + selectedEvent.venue;
  getEl("book-qty").max = Math.min(6, seatsLeft); // max 6 tickets in one booking
  getEl("book-qty").value = 1;
  getEl("book-error").textContent = "";

  updateBookingTotal();
  getEl("booking-dialog").showModal();
}

function handleBooking(e) {
  e.preventDefault(); // stop the page from reloading

  const name = getEl("book-name").value.trim();
  const phone = getEl("book-phone").value.trim();
  const qty = parseInt(getEl("book-qty").value);
  const seatsLeft = selectedEvent.seats - selectedEvent.sold;
  const maxTickets = Math.min(6, seatsLeft);
  const errorBox = getEl("book-error");

  // validation
  if (name.length < 2) {
    errorBox.textContent = "Please enter your name.";
    return;
  }
  // Indian mobile numbers are 10 digits and start with 6, 7, 8 or 9
  if (!/^[6-9][0-9]{9}$/.test(phone)) {
    errorBox.textContent = "Please enter a valid 10-digit mobile number.";
    return;
  }
  if (isNaN(qty) || qty < 1 || qty > maxTickets) {
    errorBox.textContent = "You can book between 1 and " + maxTickets + " tickets.";
    return;
  }

  // make a random booking code like NK7X2A
  const code = "NK" + Math.random().toString(36).slice(2, 6).toUpperCase();

  const newBooking = {
    code: code,
    eventId: selectedEvent.id,
    title: selectedEvent.title,
    date: selectedEvent.date,
    time: selectedEvent.time,
    venue: selectedEvent.venue,
    name: name,
    phone: phone,
    qty: qty,
    payment: getEl("book-payment").value,
    total: selectedEvent.price * qty
  };

  bookings.unshift(newBooking); // add at the start of the list
  selectedEvent.sold += qty;
  saveData();

  getEl("booking-dialog").close();
  getEl("booking-form").reset();

  getEl("success-text").textContent =
    qty + " ticket(s) for " + selectedEvent.title + ". Show this code at the entrance:";
  getEl("success-code").textContent = code;
  getEl("success-dialog").showModal();

  renderEvents();
  renderTickets();
}

function cancelBooking(code) {
  const confirmed = confirm("Do you want to cancel this booking?");
  if (!confirmed) {
    return;
  }

  const booking = bookings.find(function (b) {
    return b.code === code;
  });

  // give the seats back to the event
  const event = events.find(function (ev) {
    return ev.id === booking.eventId;
  });
  if (event) {
    event.sold = event.sold - booking.qty;
    if (event.sold < 0) {
      event.sold = 0;
    }
  }

  bookings = bookings.filter(function (b) {
    return b.code !== code;
  });

  saveData();
  renderTickets();
  renderEvents();
  showToast("Booking cancelled");
}


// ---------- Hosting an event ----------

function handleHostForm(e) {
  e.preventDefault();

  const title = getEl("host-title").value.trim();
  const venue = getEl("host-venue").value.trim();
  const date = getEl("host-date").value;
  const time = getEl("host-time").value;
  const price = parseInt(getEl("host-price").value);
  const seats = parseInt(getEl("host-seats").value);
  const errorBox = getEl("host-error");

  if (title.length < 3) {
    errorBox.textContent = "Event name must be at least 3 letters.";
    return;
  }
  if (venue === "") {
    errorBox.textContent = "Please add the venue.";
    return;
  }
  if (date === "" || date < getFutureDate(0)) {
    errorBox.textContent = "Please pick today or a future date.";
    return;
  }
  if (time === "") {
    errorBox.textContent = "Please add a start time.";
    return;
  }
  if (isNaN(price) || price < 0 || isNaN(seats) || seats < 1) {
    errorBox.textContent = "Please enter a valid price and number of seats.";
    return;
  }

  errorBox.textContent = "";

  const newEvent = {
    id: "e" + Date.now(),
    title: title,
    category: getEl("host-category").value,
    date: date,
    time: time,
    venue: venue,
    price: price,
    seats: seats,
    sold: 0,
    description: getEl("host-desc").value.trim(),
    mine: true // so we can show the remove button
  };

  events.push(newEvent);
  saveData();

  getEl("host-form").reset();
  getEl("host-price").value = 100;
  getEl("host-seats").value = 30;

  renderEvents();
  showSection("events-section");
  showToast("Event published");
}

function deleteEvent(eventId) {
  const confirmed = confirm("Do you want to remove this event?");
  if (!confirmed) {
    return;
  }
  events = events.filter(function (event) {
    return event.id !== eventId;
  });
  saveData();
  renderEvents();
  showToast("Event removed");
}


// ---------- Connecting buttons to functions ----------

// navigation buttons
document.querySelectorAll(".nav-btn").forEach(function (button) {
  button.addEventListener("click", function () {
    showSection(button.dataset.section);
    if (button.dataset.section === "tickets-section") {
      renderTickets();
    }
  });
});

// category buttons
getEl("category-buttons").addEventListener("click", function (e) {
  const category = e.target.dataset.category;
  if (category) {
    selectedCategory = category;
    renderCategoryButtons();
    renderEvents();
  }
});

// search box
getEl("search-box").addEventListener("input", renderEvents);

// "Book now" and "Remove" buttons inside the events list
getEl("events-list").addEventListener("click", function (e) {
  if (e.target.dataset.book) {
    openBookingForm(e.target.dataset.book);
  }
  if (e.target.dataset.delete) {
    deleteEvent(e.target.dataset.delete);
  }
});

// "Cancel booking" button inside the tickets list
getEl("tickets-list").addEventListener("click", function (e) {
  if (e.target.dataset.cancel) {
    cancelBooking(e.target.dataset.cancel);
  }
});

// booking popup
getEl("book-qty").addEventListener("input", updateBookingTotal);
getEl("booking-form").addEventListener("submit", handleBooking);
getEl("cancel-book-btn").addEventListener("click", function () {
  getEl("booking-dialog").close();
});
getEl("close-success-btn").addEventListener("click", function () {
  getEl("success-dialog").close();
});

// host form
getEl("host-form").addEventListener("submit", handleHostForm);
getEl("host-date").min = getFutureDate(0); // cannot pick past dates


// ---------- Start the app ----------
loadData();
renderCategoryButtons();
renderEvents();
renderTickets();