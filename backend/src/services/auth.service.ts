import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(fullName: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userRepository.createUser({
      fullName,
      email,
      password: hashedPassword,
      role: 'EMPLOYEE',
    });

    return {
      user,
      token: generateToken({ sub: user.id, role: user.role }),
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return {
      user,
      token: generateToken({ sub: user.id, role: user.role }),
    };
  }
}
