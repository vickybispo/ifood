// scripts.js
// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.getElementById('login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('menu').style.display = 'block';
        })
        .catch((error) => {
            alert('Erro ao fazer login: ' + error.message);
        });
});

document.getElementById('register-button').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('Usuário registrado com sucesso!');
        })
        .catch((error) => {
            alert('Erro ao registrar: ' + error.message);
        });
});

const cart = [];

document.querySelectorAll('.item input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const name = this.getAttribute('data-name');
        const price = parseFloat(this.getAttribute('data-price'));

        if (this.checked) {
            const quantity = prompt(`Quantas unidades de ${name} você deseja?`);
            if (quantity) {
                cart.push({ name, price, quantity: parseInt(quantity) });
                updateCart();
            } else {
                this.checked = false;
            }
        } else {
            const index = cart.findIndex(item => item.name === name);
            cart.splice(index, 1);
            updateCart();
        }
    });
});

function updateCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';

    let totalPrice = 0;
    cart.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${item.name}</td><td>${item.quantity}</td><td>R$ ${item.price * item.quantity}</td>`;
        cartItems.appendChild(row);

        totalPrice += item.price * item.quantity;
    });

    document.getElementById('total-price').innerText = totalPrice;
}

document.getElementById('checkout-button').addEventListener('click', function() {
    document.getElementById('checkout-form').style.display = 'block';
});

document.getElementById('cancel-button').addEventListener('click', function() {
    document.getElementById('checkout-form').style.display = 'none';
});

document.getElementById('payment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const paymentMethod = document.getElementById('payment-method').value;
    const customerName = document.getElementById('customer-name').value;
    const address = document.getElementById('address').value;

    // Process payment (example using Stripe)
    const stripe = Stripe('YOUR_STRIPE_PUBLIC_KEY');
    stripe.redirectToCheckout({
        lineItems: cart.map(item => ({
            price_data: {
                currency: 'brl',
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 100,
            },
            quantity: item.quantity,
        })),
        mode: 'payment',
        successUrl: window.location.href,
        cancelUrl: window.location.href,
    })
    .then(result => {
        if (result.error) {
            alert(result.error.message);
        }
    });

    // Save order to Firestore
    db.collection('orders').add({
        customerName,
        address,
        paymentMethod,
        items: cart,
        totalPrice: parseFloat(document.getElementById('total-price').innerText)
    }).then(() => {
        alert('Pedido realizado com sucesso!');
        document.getElementById('checkout-form').style.display = 'none';
        cart.length = 0;
        updateCart();
    }).catch(error => {
        alert('Erro ao salvar pedido: ' + error.message);
    });
});
