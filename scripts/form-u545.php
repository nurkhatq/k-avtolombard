<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Получение данных из формы
$name = isset($_POST['custom_U792']) ? trim($_POST['custom_U792']) : '';
$phone = isset($_POST['custom_U547']) ? trim($_POST['custom_U547']) : '';
$car_model = isset($_POST['custom_U837']) ? trim($_POST['custom_U837']) : '';
$year = isset($_POST['custom_U849']) ? trim($_POST['custom_U849']) : '';

// Валидация
$errors = [];

if (empty($phone)) {
    $errors[] = 'Номер телефона обязателен';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['errors' => $errors]);
    exit;
}

// Подготовка данных для сохранения
$data = [
    'name' => $name,
    'phone' => $phone,
    'car_model' => $car_model,
    'year' => $year,
    'timestamp' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
];

// Сохранение в файл (можно заменить на базу данных)
$log_file = 'applications.log';
$log_entry = json_encode($data, JSON_UNESCAPED_UNICODE) . "\n";
file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);

// Отправка email уведомления (настройте под свой email)
$to = 'dnurhat140@gmail.com';
$subject = 'Новая заявка с сайта автоломбарда';
$message = "Получена новая заявка:\n\n";
$message .= "Имя: " . $name . "\n";
$message .= "Телефон: " . $phone . "\n";
$message .= "Марка и модель: " . $car_model . "\n";
$message .= "Год: " . $year . "\n";
$message .= "Время: " . $data['timestamp'] . "\n";
$message .= "IP: " . $data['ip'] . "\n";

$headers = 'From: noreply@localhost' . "\r\n" .
           'Content-Type: text/plain; charset=UTF-8' . "\r\n";

// Раскомментируйте для отправки email
mail($to, $subject, $message, $headers);

// Возврат успешного ответа
echo json_encode([
    'success' => true,
    'message' => 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.'
]);
?>